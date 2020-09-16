import os
import simplejson as json
import time
import boto3
import functools


LAMBDA_INFO = {
    'is_warm': False,
    'function_name': os.getenv('AWS_LAMBDA_FUNCTION_NAME', 'FAILED_TO_RETRIEVE_LAMBDA_NAME'),
    'function_version': os.getenv('AWS_LAMBDA_FUNCTION_VERSION', 'FAILED_TO_RETRIEVE_LAMBDA_VERSION'),
}


def warmer(flag='warmer', concurrency='concurrency', delay=75, send_metric=False):
    config = dict(flag=flag, concurrency=concurrency, delay=delay, send_metric=send_metric)

    def decorator(f):
        @functools.wraps(f)
        def wrapped_func(app, event, context, *args, **kwargs):
            execution_info = dict(
                instance_id=context.aws_request_id,
                is_warmer_invocation=event.get(flag) or False,
                **LAMBDA_INFO
            )

            # More latency
            # log_current_state(
            #     send_metric,
            #     **execution_info
            # )

            LAMBDA_INFO['is_warm'] = True

            if execution_info['is_warmer_invocation']:
                warmer_fan_out(event, config=config, **execution_info)
            else:
                return f(app, event, context, *args, **kwargs)

        return wrapped_func

    return decorator


def log_current_state(send_metric, **execution_info):

    print(execution_info)

    if send_metric:
        response = boto3.client('cloudwatch').put_metric_data(
            Namespace='LambdaWarmer',
            MetricData=[dict(
                MetricName='WarmStart' if execution_info['is_warm'] else 'ColdStart',
                Dimensions=[dict(Name='By Function Name', Value=execution_info['function_name'])],
                Unit='None',
                Value=1
            )]
        )
        print(response)


def warmer_fan_out(event, config=None, **execution_info):
    concurrency = max(event.get(config['concurrency']) or 1, 1)
    invoke_count = event.get('__WARMER_INVOCATION__') or 1
    invoke_total = event.get('__WARMER_CONCURRENCY__') or concurrency
    correlation_id = event.get('__WARMER_CORRELATION_ID__') or execution_info['instance_id']

    print(dict(
        action='warmer',
        correlation_id=correlation_id,
        count=invoke_count,
        concurrency=invoke_total,
        **execution_info
    ))

    if concurrency > 1:
        _perform_fan_out_warm_up_calls(config, correlation_id, concurrency)
    elif invoke_count > 1:
        time.sleep(config['delay'] / 1000.0)  # without delay, you might just get a reused container


def _perform_fan_out_warm_up_calls(config, correlation_id, concurrency):

    base_payload = {
        config['flag']: True,
        '__WARMER_CONCURRENCY__': concurrency,
        '__WARMER_CORRELATION_ID__': correlation_id
    }

    for i in range(1, concurrency):
        try:
            boto3.client('lambda').invoke(
                FunctionName='{function_name}:{function_version}'.format(**LAMBDA_INFO),
                InvocationType='Event' if i < concurrency - 1 else 'RequestResponse',
                Payload=json.dumps(dict(base_payload, __WARMER_INVOCATION__=(i + 1)))
            )
        except Exception as e:
            print('Failed to invoke {} during warm up fan out'.format(LAMBDA_INFO['function_name']))