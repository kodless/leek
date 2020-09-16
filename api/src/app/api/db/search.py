import time
from elasticsearch import exceptions as es_exceptions

from ..errors import responses
from ..ext import es


def search_index(index_alias, query, params):
    start_time = time.time()
    connection = es.connection
    try:
        d = connection.search(index=index_alias, body=query, **params)
        print("--- Search %s seconds ---" % (time.time() - start_time))
        return d, 200
    except es_exceptions.ConnectionError:
        return responses.cache_backend_unavailable
    except es_exceptions.NotFoundError:
        return responses.application_not_found
