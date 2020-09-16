from flask_cors import CORS

from .es import ESExtension

cors = CORS()
es = ESExtension()
