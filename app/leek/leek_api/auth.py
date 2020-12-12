import time

import requests
from cachecontrol import CacheControl
from cachecontrol.caches import FileCache
from jose import jwt, jws, JWTError
from jose.utils import base64url_decode

from leek.leek_api.conf import settings

_CERT_URL = "https://www.googleapis.com/service_accounts/v1/metadata/x509/securetoken@system.gserviceaccount.com"


def search_for_key(token, keys):
    # get the kid from the headers prior to verification
    headers = jwt.get_unverified_headers(token)
    kid = headers["kid"]
    # search for the kid in the downloaded public keys
    for key in keys:
        if kid == key["kid"]:
            return key
    raise JWTError(f"Public key not found in provided keys")


def get_public_key(token):
    """
    Because Google's public keys are only changed infrequently (on the order of once per day),
    we can take advantage of caching to reduce latency and the potential for network errors.
    """
    sess = CacheControl(requests.Session(), cache=FileCache('/tmp/firebase-certs-cache'))
    request = sess.get(_CERT_URL)
    ks = request.json()
    keys = []
    for k, v in ks.items():
        keys.append({
            "alg": "RS256",
            "kid": k,
            "pem": v
        })
    return search_for_key(token, keys)


def valid_signature(token, key):
    if isinstance(key, dict):
        # verify the signature, exception should be thrown if verification failed
        jws.verify(token, key['pem'], [key['alg']], verify=True)
    else:
        # get the last two sections of the token,
        # message and signature (encoded in base64)
        message, encoded_signature = str(token).rsplit('.', 1)
        # decode the signature
        decoded_signature = base64url_decode(encoded_signature.encode('utf-8'))
        # verify the signature
        if not key.verify(message.encode("utf8"), decoded_signature):
            raise JWTError('Signature verification failed')
    return True


def decode(token, verify_expiration=True, authorized_audiences=None):
    # since we passed the verification, we can now safely
    # use the unverified claims
    claims = jwt.get_unverified_claims(token)
    # additionally we can verify the token expiration
    if verify_expiration:
        if time.time() > claims['exp']:
            raise JWTError('Token is expired')
    # and the Audience
    if authorized_audiences:
        # OID TOKEN (aud), OAUTH ACCESS TOKEN (client_id)
        aud = claims.get('aud', claims.get('client_id'))
        if not aud:
            raise JWTError('Token does not have aud nor client_id attribute')
        if aud not in authorized_audiences:
            raise JWTError('Token was not issued for this audience')
    # now we can use the claims
    return claims


def verify(token):
    key = get_public_key(token)
    if valid_signature(token, key):
        authorized_audiences = settings.LEEK_AUTHORIZED_AUDIENCES
        return decode(
            token,
            verify_expiration=settings.LEEK_AUTHORIZED_AUDIENCES,
            authorized_audiences=authorized_audiences.split(',') if len(authorized_audiences) else None
        )


def decode_jwt_token(token):
    claims = verify(token)
    if claims:
        return claims
