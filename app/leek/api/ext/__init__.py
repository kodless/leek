from flask_cors import CORS

from .es import ESExtension

cors = CORS(expose_headers=["Content-Disposition"])
es = ESExtension()
