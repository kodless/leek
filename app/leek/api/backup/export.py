import logging

from leek.api.ext import es

logger = logging.getLogger(__name__)


def export_by_query(index, query, scroll_size=1000, scroll_context="10s"):
    body = {
        "size": scroll_size,
        "query": query
    }
    docs = []
    connection = es.connection
    response = connection.search(
        index=index,
        body=body,
        scroll=scroll_context  # length of time to keep search context
    )
    # keep track of pass scroll _id
    scroll_id = response["_scroll_id"]

    # use a 'while' iterator to loop over document 'hits'
    while len(response["hits"]["hits"]):
        # make a request using the Scroll API
        response = connection.scroll(
            scroll_id=scroll_id,
            scroll=scroll_context  # length of time to keep search context
        )

        # keep track of pass scroll _id
        scroll_id = response["_scroll_id"]

        # iterate over the document hits for each 'scroll'
        for doc in response["hits"]["hits"]:
            docs.append(doc["_source"])

    return docs
