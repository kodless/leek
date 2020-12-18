from elasticsearch import exceptions as es_exceptions

from leek.api.errors import responses
from leek.api.ext import es


# https://www.elastic.co/blog/implementing-hot-warm-cold-in-elasticsearch-with-index-lifecycle-management

def create_or_update_default_lifecycle_policy(
        hot_max_size=100,
        hot_max_age=10,
        warm_age=5,
        cold_age=10,
        delete_age=15
):
    """
    The lifecycle policy governs how the index transitions through these stages and
    the actions that are performed on the index at each stage. The policy can specify:
    :param hot_max_age: The maximum age at which you want to roll over to a new index.
    :param hot_max_size: The maximum size at which you want to roll over to a new index.
    :param warm_age: The point at which the index is no longer being updated and
    the number of primary shards can be reduced and force a merge to permanently
    delete documents marked for deletion.
    :param cold_age: The point at which the index can be moved to less performant hardware.
    :param delete_age: When the index can be safely deleted.
    """
    policy = {
        "policy": {
            "phases": {
                # the index is actively being updated and queried.
                "hot": {
                    "min_age": "0ms",
                    "actions": {
                        # setting the idx priority to a high value so that hot indexes will recover before other indexes
                        "set_priority": {
                            "priority": 50
                        },
                        # The rollover action is used to manage the size or age of each index.
                        # After `hot_age` days or 50gb (whichever comes first) the index will rollover and a new index
                        # will be created. That new index will start the policy all over again.
                        # https://www.elastic.co/guide/en/elasticsearch/reference/current/index-rollover.html
                        "rollover": {
                            "max_size": f"{hot_max_size}mb",
                            "max_age": f"{hot_max_age}d"
                        },
                    }
                },
                # the index is no longer being updated, but is still being queried.
                "warm": {
                    # the current index (the one that just rolled over) will wait up to `warm_age` days since it was
                    # rolled over to enter the warm phase.
                    "min_age": f"{warm_age}d",
                    "actions": {
                        # set the index priority to a value lower than hot (but greater then cold)
                        "set_priority": {
                            "priority": 25
                        },
                        # The force merge action can be used to optimize indexes.
                        # force merge the index down to 1 segment
                        "forcemerge": {
                            "max_num_segments": 1
                        },
                        # shrink the index to 1 shard
                        "shrink": {
                            "number_of_shards": 1
                        },
                        # move index to the warm nodes
                        "allocate": {
                            "require": {
                                "data": "warm"
                            }
                        },
                    }
                },
                # the index is no longer being updated and is seldom queried. The information still needs to be
                # searchable, but it’s okay if those queries are slower.
                "cold": {
                    # wait `cold_age` days (since it was rolled over) to enter the cold phase.
                    "min_age": f"{cold_age}d",
                    "actions": {
                        # lower the index priority to ensure that hot and warm indexes recover first
                        "set_priority": {
                            "priority": 0
                        },
                        # The freeze action can be used to reduce memory pressure in the cluster
                        # freeze the index and move it to the cold node(s)
                        "freeze": {},
                        "allocate": {
                            "require": {
                                "data": "cold"
                            }
                        }
                    }
                },
                # ​the index is no longer needed and can safely be deleted.
                "delete": {
                    # wait `delete_age` days (since it was rolled over) to enter the delete phase.
                    "min_age": f"{delete_age}d",
                    "actions": {
                        "delete": {}
                    }
                }
            }
        }
    }
    try:
        return es.connection.ilm.put_lifecycle("hot-warm-cold-delete-60days", body=policy), 200
    except es_exceptions.ConnectionError:
        return responses.cache_backend_unavailable
