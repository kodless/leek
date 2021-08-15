task_retry_failed = {
                                "error": {
                                    "code": "500001",
                                    "message": "Task retry failed",
                                    "reason": "Task retry could not queued!"
                                }
                            }, 500

task_revocation_failed = {
                                "error": {
                                    "code": "500002",
                                    "message": "Task revocation failed",
                                    "reason": "Task revocation command could not be queued"
                                }
                            }, 500

search_backend_unavailable = {
                                "error": {
                                    "code": "503001",
                                    "message": "Service temporary unavailable",
                                    "reason": "Search backend unavailable"
                                }
                            }, 503

broker_not_reachable = {
                           "error": {
                               "code": "503002",
                               "message": "Agent error",
                               "reason": "Broker not reachable, check your network firewall!"
                           }
                       }, 503

application_already_exist = {
                                "error": {
                                    "code": "412001",
                                    "message": "Application already exist",
                                    "reason": "A template with the same name already exist"
                                }
                            }, 412

application_not_found = {
                            "error": {
                                "code": "404001",
                                "message": "Application does not exist",
                                "reason": "Index not yet created"
                            }
                        }, 404

task_retry_subscription_not_found = {
                                        "error": {
                                            "code": "404002",
                                            "message": "Task failed to retry",
                                            "reason": "Subscription not found, subscription names should be in the form of `app_name-env_name`"
                                        }
                                    }, 404

wrong_application_app_key = {
                                "error": {
                                    "code": "401001",
                                    "message": "Not Authorized",
                                    "reason": "Application API Key is wrong"
                                }
                            }, 401

insufficient_permission = {
                              "error": {
                                  "code": "401002",
                                  "message": "Insufficient permission",
                                  "reason": "You don't have enough permission for this action"
                              }
                          }, 401
missing_headers = {
                      "error": {
                          "code": "400001",
                          "message": "Invalid request",
                          "reason": "One or more headers are messing"
                      }
                  }, 400

no_subscriptions_found = {
                             "error": {
                                 "code": "400003",
                                 "message": "Agent error",
                                 "reason": "No subscriptions found, agent not started!"
                             }
                         }, 400

malformed_args_or_kwarg_repr = {
                                   "error": {
                                       "code": "400004",
                                       "message": "Malformed args or kwargs",
                                       "reason": "In order for the apply to work, please make sure the args/kwargs "
                                                 "are not truncated by increasing resultrepr_maxsize"
                                   }
                               }, 400

control_operations_not_supported = {
                                       "error": {
                                           "code": "400005",
                                           "message": "Operation not supported",
                                           "reason": "Control operations available only if agent is local"
                                       }
                                   }, 400

task_not_routable = {
                        "error": {
                            "code": "400006",
                            "message": "Task not routable",
                            "reason": "Task does not have a routing key"
                        }
                    }, 400

wrong_access_refused = {
                           "error": {
                               "code": "401004",
                               "message": "Agent error",
                               "reason": "Access refused to broker, wrong username/password!"
                           }
                       }, 401

subscription_already_exist = {
                                 "error": {
                                     "code": "412002",
                                     "message": "Subscription already exist",
                                     "reason": "A subscription with the same name already exist"
                                 }
                             }, 412

task_retry_state_precondition_failed = {
                                           "error": {
                                               "code": "412003",
                                               "message": "Task not retryable",
                                               "reason": "Only tasks in terminal state can be retried"
                                           }
                                       }, 412

task_revoke_state_precondition_failed = {
                                            "error": {
                                                "code": "412004",
                                                "message": "Task(s) not revocable",
                                                "reason": "Only tasks not in terminal state can be revoke"
                                            }
                                        }, 412
