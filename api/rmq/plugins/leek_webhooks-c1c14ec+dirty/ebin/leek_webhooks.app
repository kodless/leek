{application, 'leek_webhooks', [
	{description, "RabbitMQ Webhooks Published Over HTTP"},
	{vsn, "c1c14ec+dirty"},
	{modules, ['leek_webhooks_app','leek_webhooks_sup','leek_webhooks_worker']},
	{registered, [leek_webhooks_sup]},
	{applications, [kernel,stdlib,rabbit_common,rabbit,amqp_client,hackney,rabbitmq_management]},
	{mod, {leek_webhooks_app, []}},
	{env, [
	{username, <<"guest">>},
	{password, <<"guest">>},
	{virtual_host, <<"/">>},
	{subscriptions,
		[
			{default,
				[
					{exchange, <<"webhooks">>},
					{queue, <<"webhooks.fanout">>},
					{routing_key, <<"#">>},
					{api_url, <<"http://scooterlabs.com/echo">>},
					{custom_headers,
                      [
                        {<<"x-leek-api-key">>, <<"secret">>},
                        {<<"x-leek-org-name">>, <<"ramp">>},
                        {<<"x-leek-app-name">>, <<"leek">>},
                        {<<"x-leek-app-env">>, <<"prod">>}
                      ]
                    },
                    {success_status_codes, [201]},
                    {backoff_status_codes, [404]},
                    {backoff_delay_ms, 5000}
				]
			}
		]
	}
]},
		{broker_version_requirements, []}
]}.