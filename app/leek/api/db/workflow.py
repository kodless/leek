import json
from collections import UserDict

from leek.api.ext import es


class Node(object):
    def __init__(self, uuid, parent_id, name, state):
        self.uuid = uuid
        self.name = name
        self.state = state
        self.parent_id = parent_id
        self.children = []


class NodeDict(UserDict):
    def addNodes(self, nodes):
        """ Add every node as a child to its parent by doing two passes."""
        for i in (1, 2):
            for node in nodes:
                self.data[node.uuid] = node
                if node.parent_id in self.data.keys():
                    if node.parent_id is not None and node not in self.data[node.parent_id].children:
                        self.data[node.parent_id].children.append(node)


class NodeJSONEncoder(json.JSONEncoder):
    def default(self, node):
        if type(node) == Node:
            item = {
                "key": node.uuid,
                "title": node.name,
                "state": node.state,
                "children": node.children
            }
            return item
        raise TypeError("{} is not an instance of Node".format(node))


def build_workflow_tree(data, root_task):
    nodes = []
    nodes.append(
        Node(
            root_task["uuid"],
            None,
            root_task["name"],
            root_task["state"]
        )
    )
    for task in data:
        nodes.append(
            Node(
                task.get("uuid"),
                task.get("parent_id"),
                task.get("name"),
                task.get("state")
            )
        )

    nodeDict = NodeDict()
    nodeDict.addNodes(nodes)

    rootNodes = [node for uuid, node in nodeDict.items() if node.parent_id is None]
    tree = []
    for rootNode in rootNodes:
        t = NodeJSONEncoder().encode(rootNode)
        tree.append(json.loads(t))
    return tree


def get_workflow_buckets(
        index_alias,
        app_env,
        root_id,
):
    body = {
        "size": 0,
        "query": {
            "bool": {
                "must": [
                    {"match": {"kind": "task"}},
                    {"match": {"app_env": app_env}},
                    {"match": {"root_id": root_id}}
                ]
            }
        },
        "aggs": {
            "statesDistribution": {"terms": {"field": "state"}}
        }
    }
    connection = es.connection
    response = connection.search(
        index=index_alias,
        body=body,
    )
    return response["aggregations"]["statesDistribution"]["buckets"]


def get_workflow_duration(
        index_alias,
        app_env,
        root_id,
        start_time
):
    body = {
        "size": 1,
        "query": {
            "bool": {
                "must": [
                    {"match": {"kind": "task"}},
                    {"match": {"app_env": app_env}},
                    {"match": {"root_id": root_id}}
                ]
            }
        },
        "sort": [
            {
                "timestamp": {
                    "order": "desc"
                }
            }
        ],
    }
    connection = es.connection
    response = connection.search(
        index=index_alias,
        body=body,
    )
    hits = response["hits"]["hits"]
    if len(hits):
        latest_update = hits[0]["_source"]["timestamp"]
        return latest_update-start_time
    else:
        return None


def get_workflow_info(
        index_alias,
        app_env,
        root_id,
):
    connection = es.connection
    root_task = connection.get(index=index_alias, id=root_id)["_source"]
    wf_start_time = root_task.get("queued_at", root_task.get("received_at", root_task.get("started_at", root_task.get("timestamp"))))
    wf_duration = get_workflow_duration(index_alias, app_env, root_id, wf_start_time)
    if wf_duration is None:
        return None
    stats = get_workflow_buckets(index_alias, app_env, root_id)
    return {
        "start_time": wf_start_time,
        "duration": wf_duration,
        "root": {
            "uuid": root_task["uuid"],
            "name": root_task["name"],
            "state": root_task["state"]
        },
        "stats": stats
    }


def get_node_data(response):
    data = []
    for doc in response["hits"]["hits"]:
        source = doc["_source"]
        data.append({
            "uuid": source["uuid"],
            "name": source["name"],
            "parent_id": source.get("parent_id"),
            "state": source["state"],
        })
    return data, response["_scroll_id"]


def get_celery_workflow_tree(
        index_alias,
        app_env,
        root_id,
        scroll_size=1000,
        scroll_context="10s",
):
    docs = []
    connection = es.connection
    wf_info = get_workflow_info(index_alias, app_env, root_id)
    if wf_info is None:
        return {
            "workflow": None
        }
    body = {
        "size": scroll_size,
        "query": {
            "bool": {
                "must": [
                    {"match": {"kind": "task"}},
                    {"match": {"app_env": app_env}},
                    {"match": {"root_id": root_id}}
                ]
            }
        }
    }
    response = connection.search(
        index=index_alias,
        body=body,
        scroll=scroll_context
    )
    # keep track of past scroll _id
    data, scroll_id = get_node_data(response)
    docs.extend(data)

    while len(response["hits"]["hits"]):
        response = connection.scroll(
            scroll_id=scroll_id,
            scroll=scroll_context
        )

        data, scroll_id = get_node_data(response)
        docs.extend(data)

    workflow_tree = build_workflow_tree(docs, wf_info["root"])
    wf_info.update({
        "total": len(docs)+1,
        "workflow": workflow_tree
    })
    return wf_info
