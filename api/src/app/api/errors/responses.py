cache_backend_unavailable = {
                                "error": {
                                    "code": "503001",
                                    "message": "Service temporary unavailable",
                                    "reason": "Cache backend unavailable"
                                }
                            }, 503

application_not_found = {
                            "error": {
                                "code": "404001",
                                "message": "Application does not exist",
                                "reason": "Index not yet created"
                            }
                        }, 404

application_already_exist = {
                                "error": {
                                    "code": "401001",
                                    "message": "Application already exist",
                                    "reason": "A template with the same name already exist"
                                }
                            }, 401

wrong_application_app_key = {
                                "error": {
                                    "code": "401001",
                                    "message": "Not Authorized",
                                    "reason": "Application API Key is wrong"
                                }
                            }, 401

missing_headers = {
                      "error": {
                          "code": "401001",
                          "message": "Invalid request",
                          "reason": "One or more headers are messing"
                      }
                  }, 400
