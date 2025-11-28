import logging

from leek.api.ext import es

logger = logging.getLogger(__name__)


def detect_search_backend():
    """
    Detect whether the search backend is Elasticsearch (default),
    Elasticsearch OSS, OpenSearch, or unknown.

    Returns
    -------
    dict
        {
            "backend": "elasticsearch" | "elasticsearch-oss" | "opensearch" | "unknown",
            "version": "x.y.z" or None,
            "raw": {...} full JSON response from GET / (for debugging)
        }
    """
    try:
        conn = es.connection
        info = conn.info()
    except Exception as e:
        return {
            "backend": "unknown",
            "version": None,
            "error": str(e),
            "raw": None,
        }

    version_info = info.get("version", {}) or {}

    # Root-level hints
    distribution = (version_info.get("distribution") or "").lower()
    build_flavor = (version_info.get("build_flavor") or "").lower()
    number = version_info.get("number")
    info_str = str(info).lower()

    # --- Backend detection ---
    if distribution == "opensearch":
        backend = "opensearch"
    elif "opensearch" in info_str:
        # Tagline or other fields say "The OpenSearch Project"
        backend = "opensearch"
    elif build_flavor == "default":
        backend = "elasticsearch"
    elif build_flavor == "oss":
        backend = "elasticsearch-oss"
    else:
        backend = "unknown"

    detected_version = number

    # --- Fix AWS spoofing / get real OpenSearch version from /_nodes ---
    if backend == "opensearch":
        try:
            nodes_info = conn.nodes.info()
            node_versions = {
                node.get("version")
                for node in nodes_info.get("nodes", {}).values()
                if node.get("version")
            }

            if node_versions:
                # Pick the highest semantic version from node_versions
                def parse_ver(v):
                    # Fallback: anything non-numeric just sorts as 0.0.0
                    try:
                        parts = v.split(".")
                        return tuple(int(p) for p in parts[:3]) + (0,) * (3 - len(parts))
                    except Exception:
                        return (0, 0, 0)

                detected_version = max(node_versions, key=parse_ver)

                # If root lied with 7.10.2 but nodes are on 2.x/3.x/etc,
                # we now overwrite with the node version.
        except Exception:
            # If anything goes wrong, just keep whatever we had from GET /
            pass

    return {
        "backend": backend,
        "version": detected_version,
        "raw": info,
    }


class UnsupportedSearchBackend(Exception):
    """Raised when the search backend or version is not supported."""
    pass


def validate_supported_backend():
    """
    Detect and validate that the backend is:
      - OpenSearch >= 2.15
      - OR Elasticsearch >= 7.8.0

    Otherwise raise UnsupportedSearchBackend.

    Returns
    -------
    dict
        {
            "backend": "opensearch" | "elasticsearch",
            "version": "x.y.z"
        }
    """
    info = detect_search_backend()

    backend = info.get("backend")
    version = info.get("version")

    logger.info(f"Detected {backend}:{version} as search backend!")

    if not backend or not version:
        raise UnsupportedSearchBackend(
            f"Could not determine search backend or version"
        )

    # Parse version safely
    try:
        parts = version.split(".")
        major = int(parts[0])
        minor = int(parts[1])
        patch = int(parts[2]) if len(parts) > 2 else 0
    except Exception:
        raise UnsupportedSearchBackend(
            f"Invalid version format '{version}' returned by backend"
        )

    # --- OpenSearch requirement ---
    if backend == "opensearch":
        if major > 2 or (major == 2 and minor >= 15):
            return {"backend": backend, "version": version}
        raise UnsupportedSearchBackend(
            f"OpenSearch {version} is below the minimum supported version 2.15.0"
        )

    # --- Elasticsearch requirement ---
    if backend == "elasticsearch":
        # Elasticsearch 7.8.0+
        if major > 7 or (major == 7 and minor >= 8):
            return {"backend": backend, "version": version}
        raise UnsupportedSearchBackend(
            f"Elasticsearch {version} is below the minimum supported version 7.8.0"
        )

    # Anything else: OSS, unknown, old
    raise UnsupportedSearchBackend(
        f"Unsupported backend '{backend}' or version {version}"
    )
