import requests
import hashlib
import random
from base64 import b64encode
from datetime import datetime

url = 'https://tigerbook.herokuapp.com/api/v1/undergraduates'
created = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
nonce = ''.join([random.choice('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/=') for i in range(32)])
username = 'jca4'
password = 'Mcraftsman2014PU'
generated_digest = b64encode(hashlib.sha256(nonce + created + password).digest())
headers = {
    'Authorization': 'WSSE profile="UsernameToken"',
    'X-WSSE': 'UsernameToken Username="%s", PasswordDigest="%s", Nonce="%s", Created="%s"' % (username, generated_digest, nonce, created)
}

created = '2016-07-15T14:50:17Z'
nonce = 'WJ/uazuj9QSO9uTvqhbGyO4NvXriwbD3'
username = 'jdoe'
password = 'secret'
e = b64encode(hashlib.sha256(nonce + created + password).digest())
d = b64encode(username + password)
print e


response = requests.get(url, headers=headers)
print response.text
#response = requests.get(url, headers)
#request = urllib2.Request(url, headers=headers)

#print request.header_items()
#data = request.read()
# data = response.read()