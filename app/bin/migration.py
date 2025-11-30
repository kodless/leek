from typing import Dict, Any, List, Set, Tuple
from copy import deepcopy

from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError, TransportError

from properties import get_properties
from version import detect_search_backend
from utils import abort, logger


class TemplateSyncError(Exception):
    pass


def _extract_properties_from_template_body(template_body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract template.mappings.properties from a composable index template body.
    """
    return (
            template_body
            .get("template", {})
            .get("mappings", {})
            .get("properties", {})
            or {}
    )


def _set_properties_on_template_body(template_body: Dict[str, Any], properties: Dict[str, Any]) -> None:
    """
    Mutate the template_body to set template.mappings.properties.
    """
    template_body.setdefault("template", {})
    template_body["template"].setdefault("mappings", {})
    template_body["template"]["mappings"]["properties"] = properties


def _get_composable_template(es: Elasticsearch, template_name: str) -> Dict[str, Any]:
    """
    Get composable index template via GET /_index_template/{name}.

    Works on:
      - Elasticsearch 7.8+ (incl. 7.10)
      - OpenSearch 1.x
    """
    try:
        resp = es.indices.get_index_template(name=template_name)
    except NotFoundError:
        raise TemplateSyncError(f"Index template '{template_name}' not found")

    index_templates = resp.get("index_templates") or []
    if not index_templates:
        raise TemplateSyncError(
            f"No 'index_templates' entry found for '{template_name}'. "
            "Make sure this is a composable index template, not a legacy one."
        )

    # Composable template looks like:
    # {
    #   "index_templates": [
    #     {
    #       "name": "my-template",
    #       "index_template": { ... }
    #     }
    #   ]
    # }
    return index_templates[0]["index_template"]


def _get_indices_for_patterns(es: Elasticsearch, patterns: List[str]) -> Set[str]:
    """
    Expand index_patterns (e.g. ['logs-*']) into concrete index names
    using the _cat/indices API.

    This works on both ES and OpenSearch.
    """
    indices: Set[str] = set()

    for pattern in patterns:
        try:
            rows = es.cat.indices(index=pattern, format="json")
        except NotFoundError:
            # Pattern that matches nothing
            continue

        for row in rows:
            name = row.get("index")
            if name:
                indices.add(name)

    return indices


def _update_indices_mappings(
        es: Elasticsearch,
        indices: Set[str],
        new_fields: Dict[str, Any],
) -> Tuple[List[str], List[Tuple[str, str]]]:
    """
    Add new_fields to each index mapping using PUT /{index}/_mapping.

    Returns:
      (updated_indices, failed_indices)

      updated_indices: list of indices successfully updated
      failed_indices: list of (index, error_message) for failures
    """
    updated_indices: List[str] = []
    failed_indices: List[Tuple[str, str]] = []

    if not indices:
        return updated_indices, failed_indices

    body = {"properties": new_fields}

    for index in sorted(indices):
        try:
            es.indices.put_mapping(index=index, body=body)
            updated_indices.append(index)
        except TransportError as e:
            # IMPORTANT: we do NOT raise here so the process can continue for
            # other indices and be re-run later. We just track the failure.
            failed_indices.append((index, str(e.info)))

    return updated_indices, failed_indices


def sync_composable_template_and_indices(
        es: Elasticsearch,
        template_name: str,
        new_template_body: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Sync a composable index template (and all indices created from it)
    with newly added fields.

    Steps:
      1. Fetch existing composable index template.
      2. Compare existing template's mappings.properties with new_template_body's.
      3. Detect newly added top-level fields by field name.
      4. Find all indices matching template's index_patterns.
      5. Update each index's mapping to add only those new fields.
      6. ONLY IF all index updates succeed, update the index template itself.

    Doing the template update LAST ensures that:
      - If some indices fail to update, the template does not yet know about
        the new fields, so the same process can be safely re-run later
        and still detect these fields as "new".

    Args:
        es: Elasticsearch client (elasticsearch==7.10.0). Backend can be
            Elasticsearch 7.x or OpenSearch 1.x.
        template_name: Name of the composable index template.
        new_template_body: Dict representing the *desired* template body
            (at least the `template.mappings.properties` part).

    Returns:
        Summary dict:
            {
              "updated_template": bool,
              "new_fields": {...},
              "updated_indices": [...],
              "failed_indices": [(index, error), ...],
              "message": str,
            }

    Notes / limitations:
      - Only detects *new* top-level fields in mappings.properties.
      - Does NOT attempt to change definitions for existing fields.
      - Assumes composable templates (`_index_template`), not legacy (`_template`).
      - You can safely call this function multiple times; it is designed to be
        re-runnable if some index updates fail.
    """
    # 1. Fetch existing template from the cluster
    existing_template = _get_composable_template(es, template_name)

    existing_props = _extract_properties_from_template_body(existing_template)
    new_props = _extract_properties_from_template_body(new_template_body)

    # 2. Compute newly added fields
    new_fields = {
        field_name: field_def
        for field_name, field_def in new_props.items()
        if field_name not in existing_props
    }

    if not new_fields:
        return {
            "updated_template": False,
            "new_fields": {},
            "updated_indices": [],
            "failed_indices": [],
            "message": "No newly added fields; nothing to update.",
        }

    # 3. Get all indices that match the template's patterns
    patterns = existing_template.get("index_patterns", [])
    indices = _get_indices_for_patterns(es, patterns)

    # 4. Update mappings for those indices FIRST
    updated_indices, failed_indices = _update_indices_mappings(es, indices, new_fields)

    updated_template = False
    message_parts = []

    if failed_indices:
        # Some indices failed → DO NOT update the template.
        # This keeps the operation safely repeatable: next run will still see
        # these fields as "new" relative to the template.
        message_parts.append(
            f"Added {len(new_fields)} new field(s) to {len(updated_indices)} index/indices, "
            f"but {len(failed_indices)} index/indices failed to update. "
            "Index template was NOT updated so this operation can be retried."
        )
    else:
        # All indices updated successfully → now update the template
        merged_props = deepcopy(existing_props)
        merged_props.update(new_fields)

        updated_template_body = deepcopy(existing_template)
        _set_properties_on_template_body(updated_template_body, merged_props)

        body_to_put: Dict[str, Any] = {
            "index_patterns": updated_template_body.get("index_patterns", []),
            "template": updated_template_body.get("template", {}),
        }

        # Carry over optional keys if present
        for key in ("priority", "version", "_meta", "composed_of", "data_stream"):
            if key in updated_template_body:
                body_to_put[key] = updated_template_body[key]

        try:
            # This corresponds to:
            # PUT /_index_template/{template_name}
            es.indices.put_index_template(name=template_name, body=body_to_put)
            updated_template = True
            message_parts.append(
                f"Added {len(new_fields)} new field(s) to template '{template_name}' "
                f"and updated {len(updated_indices)} index/indices."
            )
        except TransportError as e:
            # If the template update fails, we still leave indices updated.
            # Caller can decide how to handle this.
            raise TemplateSyncError(
                f"Failed to update index template '{template_name}': {e.info}"
            ) from e

    return {
        "updated_template": updated_template,
        "new_fields": new_fields,
        "updated_indices": updated_indices,
        "failed_indices": failed_indices,
        "message": " ".join(message_parts) if message_parts else "",
    }


def migrate_index_templates(es: Elasticsearch, templates):
    try:
        for template in templates:
            result = sync_composable_template_and_indices(
                es=es,
                template_name=template,
                new_template_body={
                    "template": {
                        "mappings": {
                            "properties": get_properties(detect_search_backend(es)["backend"])
                        }
                    }
                }
            )
            logger.info(result)
    except Exception as ex:
        abort(f"Failed to migrate to new index template with error {str(ex)}")
