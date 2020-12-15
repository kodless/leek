import os
from printy import printy

LOGO = """
8 8888         8 8888888888   8 8888888888   8 8888     ,88'
8 8888         8 8888         8 8888         8 8888    ,88' 
8 8888         8 8888         8 8888         8 8888   ,88'  
8 8888         8 8888         8 8888         8 8888  ,88'   
8 8888         8 888888888888 8 888888888888 8 8888 ,88'    
8 8888         8 8888         8 8888         8 8888 88'     
8 8888         8 8888         8 8888         8 888888<      
8 8888         8 8888         8 8888         8 8888 `Y8.    
8 8888         8 8888         8 8888         8 8888   `Y8.  
8 888888888888 8 888888888888 8 888888888888 8 8888     `Y8.                        
"""
printy(LOGO, 'n>B')

LEEK_VERSION = os.environ.get("LEEK_VERSION", "-.-.-")

USAGE = f"""
[b>]|#|@     [y>]Leek Celery Monitoring Tool@                     [b>]|#|@
[b>]|#|@     [n>]Versions:@ {LEEK_VERSION}                                 [b>]|#|@
[b>]|#|@     [n>]Release date:@ 1.0.0                             [b>]|#|@
[b>]|#|@     [n>]Codename:@ Fennec                                [b>]|#|@
[b>]|#|@     [n>]Repository:@ https://github.com/kodless/leek     [b>]|#|@
[b>]|#|@     [n>]Homepage:@ https://leek.kodhive.com              [b>]|#|@
[b>]|#|@     [n>]Documentation:@ https://leek.kodhive.com/docs    [b>]|#|@

[r>]Author:@ Hamza Adami <me@adamihamza.com>
[r>]Follow me on Github:@ https://github.com/kodless 
[r>]Buy me a coffee:@ https://buymeacoffee.com/fennec
"""
printy(USAGE)


def get_bool(env_name, default="false"):
    return os.environ.get(env_name, default).lower() == "true"


def get_status(b):
    return "[n>]ENABLED@" if b else "[r>]DISABLED@"


ENABLE_ES = get_bool("LEEK_ENABLE_ES")
ENABLE_API = get_bool("LEEK_ENABLE_API")
ENABLE_AGENT = get_bool("LEEK_ENABLE_AGENT")
ENABLE_WEB = get_bool("LEEK_ENABLE_WEB")

LEEK_ES_URL = os.environ.get("LEEK_API_URL", "http://0.0.0.0:9100")
LEEK_API_URL = os.environ.get("LEEK_API_URL", "http://0.0.0.0:5000")
LEEK_WEB_URL = os.environ.get("LEEK_WEB_URL", "http://0.0.0.0:80")

SERVICES = f"""
[y>]SERVICE     STATUS      URL
=======     ------      ---@
- ES        {get_status(ENABLE_ES)}    {LEEK_ES_URL}
- API       {get_status(ENABLE_API)}    {LEEK_API_URL}
- WEB       {get_status(ENABLE_WEB)}    {LEEK_WEB_URL}
- AGENT     {get_status(ENABLE_ES)}    -
"""

printy(SERVICES)

# Check variables
if ENABLE_ES:
    pass
