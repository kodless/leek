import json
import ast
from typing import Any, Dict, Iterable, Optional, Union, List

try:
    import orjson  # Faster JSON parser if available
    _json_loads = orjson.loads
except Exception:
    _json_loads = json.loads


def promote_args(
        args: Union[str, List[Any], tuple],
        num_promoted: int = 3,
        max_len: int = 256,
        coerce_to_str: bool = True
) -> Dict[str, Any]:
    """
    Convert Celery-style args (e.g. "('John', 42)") into
    flattened positional fields: {"args_0": "John", "args_1": 42}

    ------------------------------------------------------------
    Parameters
    ------------------------------------------------------------
    args : str | list | tuple
        - If it's a string, it will be parsed using ast.literal_eval()
          to safely handle Celery's Python repr format.
        - If it's already a list or tuple, it will be used directly.

    num_promoted : int
        Number of positional args to promote into "args_N" fields.
        Extra args are ignored. Default: 3

    max_len : int
        Truncate long string values to this max length to prevent
        large documents in Elasticsearch. Default: 256

    coerce_to_str : bool
        Whether to cast non-string args to strings. Recommended True
        for keyword indexing. Default: True

    ------------------------------------------------------------
    Returns
    ------------------------------------------------------------
    Dict[str, Any]
        Example:
            promote_args("('John', 42)", 2)
            → {"args_0": "John", "args_1": "42"}
    """

    # Handle None or empty
    if args is None or args == "" or args == "()":
        return {}

    # Step 1: Parse if string (Celery emits Python repr strings)
    if isinstance(args, str):
        try:
            parsed = ast.literal_eval(args)
        except Exception:
            # fallback: wrap raw string
            parsed = [args]
    else:
        parsed = args

    # Step 2: Normalize to list
    if isinstance(parsed, tuple):
        parsed = list(parsed)
    elif not isinstance(parsed, list):
        parsed = [parsed]

    # Step 3: Truncate and coerce
    def _clean_value(v: Any) -> Any:
        if coerce_to_str:
            v = str(v)
        if isinstance(v, str) and len(v) > max_len:
            return v[:max_len]
        return v

    promoted = {}
    for i, val in enumerate(parsed[:num_promoted]):
        promoted[f"args_{i}"] = _clean_value(val)

    return promoted


def kwargs_string_to_flat_fast(
        s: str,
        sep: str = ".",
        list_policy: str = "index",  # "index" | "join" | "json"
        join_delim: str = ",",
        coerce_types: bool = True,
        max_depth: int = 12,
        max_list_items: int = 100,
        max_string_len: int = 1024,
        skip_paths: Optional[Iterable[str]] = None,
        allow_python_repr_fallback: bool = False,
) -> Dict[str, Any]:
    """
    Convert a possibly messy kwargs string (JSON or Python repr)
    into a *flat, one-level* dictionary suitable for Elasticsearch 'flattened'
    or OpenSearch 'flat_object' indexing.

    ------------------------------------------------------------
    Parameters
    ------------------------------------------------------------
    s : str
        The raw kwargs string. It may be strict JSON or Python-repr-like
        (e.g., from Celery events: "{'args': (), 'kwargs': {...}}").

    sep : str
        Separator for flattened keys (default: ".").
        Example: {"a": {"b": 1}} → {"a.b": 1}

    list_policy : str
        How to handle lists:
          - "index": create separate entries for each item (a.0, a.1)
          - "join":  join list items into a single string "v1,v2,v3"
          - "json":  store the list as a JSON string
        Default: "index"

    join_delim : str
        Delimiter used if list_policy="join". Default: ",".

    coerce_types : bool
        Convert stringy values ("true", "42", "3.14") to proper
        bool/int/float types when possible. Default: True.

    max_depth : int
        Maximum nesting depth to flatten before serializing the remainder
        as JSON. Prevents runaway recursion. Default: 12.

    max_list_items : int
        Maximum number of list elements to process (caps very large arrays).
        Default: 100.

    max_string_len : int
        Truncates excessively long string values to this length.
        Prevents large payloads from bloating the index. Default: 1024.

    skip_paths : Iterable[str] | None
        Optional set/list of dotted paths to skip entirely
        (e.g. ["kwargs.serialized_request.bills"]). Useful for ignoring
        large nested payloads that don't need to be indexed.

    allow_python_repr_fallback : bool
        Whether to allow fallback to ast.literal_eval() for parsing
        Python-like strings (single quotes, tuples, Ellipsis, etc.).
        This is slower than JSON parsing but increases robustness.
        Default: False (for performance).

    ------------------------------------------------------------
    Returns
    ------------------------------------------------------------
    Dict[str, Any]
        A flattened dictionary of key-value pairs with dotted paths.
        Example:
            Input:  "{'a': {'b': 1, 'c': [2,3]}}"
            Output: {"a.b": 1, "a.c.0": 2, "a.c.1": 3}

    ------------------------------------------------------------
    Performance Notes
    ------------------------------------------------------------
    • Uses orjson if available for very fast parsing.
    • Avoids ast.literal_eval unless fallback is enabled.
    • O(n) time complexity relative to number of fields.
    • Safe for use in concurrent ingestion threads.
    """

    if not s:
        return {}

    # Try fast JSON parsing first
    root = None
    try:
        obj = _json_loads(s)
        if isinstance(obj, dict):
            root = obj
    except Exception:
        if allow_python_repr_fallback:
            # Fallback for Python-style dict strings (Celery)
            try:
                obj = ast.literal_eval(s)
                if isinstance(obj, dict):
                    root = obj
            except Exception:
                pass

    if root is None:
        return {}

    skip_set = set(skip_paths or ())

    # ----------------------------------------------------------------------
    # Helper: convert simple string scalars into bool/int/float when possible
    # ----------------------------------------------------------------------
    def _coerce_scalar(x: Any) -> Any:
        if not coerce_types or not isinstance(x, str):
            return x
        low = x.lower()
        if low == "true":  return True
        if low == "false": return False
        try:
            if "." in x:
                return float(x)
            return int(x)
        except ValueError:
            return x

    # ----------------------------------------------------------------------
    # Helper: limit string length to protect index size
    # ----------------------------------------------------------------------
    def _clip_string(v: str) -> str:
        return v if len(v) <= max_string_len else v[:max_string_len]

    # ----------------------------------------------------------------------
    # Helper: recursively normalize complex Python objects into JSON-safe types
    # ----------------------------------------------------------------------
    def _normalize(x: Any) -> Any:
        if x is None or isinstance(x, (bool, int, float)):
            return x
        if isinstance(x, str):
            return _clip_string(x)
        if x is Ellipsis:
            return "<ELLIPSIS>"
        if isinstance(x, (bytes, bytearray)):
            try:
                return _clip_string(x.decode("utf-8", "replace"))
            except Exception:
                return _clip_string(str(x))
        if isinstance(x, tuple):
            x = list(x)
        if isinstance(x, set):
            # Sets → lists (unordered)
            x = list(x)
        if isinstance(x, list):
            # Limit list size to avoid blowup
            if len(x) > max_list_items:
                x = x[:max_list_items]
            return [_normalize(v) for v in x]
        if isinstance(x, dict):
            # Normalize keys to strings
            return {str(k): _normalize(v) for k, v in x.items()}
        # Fallback to string
        return _clip_string(str(x))

    # ----------------------------------------------------------------------
    # Helper: flatten recursively into dotted key paths
    # ----------------------------------------------------------------------
    def _flatten(prefix: str, value: Any, out: Dict[str, Any], depth: int):
        # Skip specific paths if requested
        if prefix in skip_set:
            return

        # Stop at max depth to prevent runaway recursion
        if depth > max_depth:
            out[prefix] = json.dumps(value, ensure_ascii=False)
            return

        # Handle dictionaries
        if isinstance(value, dict):
            if not value:
                out[prefix] = "{}"
                return
            for k, v in value.items():
                key = k if not prefix else f"{prefix}{sep}{k}"
                _flatten(key, v, out, depth + 1)

        # Handle lists
        elif isinstance(value, list):
            if list_policy == "index":
                if not value:
                    out[prefix] = "[]"
                else:
                    for i, v in enumerate(value):
                        key = f"{prefix}{sep}{i}"
                        _flatten(key, v, out, depth + 1)
            elif list_policy == "join":
                out[prefix] = join_delim.join(
                    str(_coerce_scalar(v)) if isinstance(v, str) else str(v)
                    for v in value
                )
            else:  # "json"
                out[prefix] = json.dumps(value, ensure_ascii=False)

        # Handle scalars
        else:
            if isinstance(value, str):
                out[prefix] = _coerce_scalar(value) if coerce_types else value
            else:
                out[prefix] = value

    # ----------------------------------------------------------------------
    # Main execution
    # ----------------------------------------------------------------------
    norm = _normalize(root)
    flat: Dict[str, Any] = {}
    for k, v in norm.items():
        _flatten(k, v, flat, 1)

    return flat
