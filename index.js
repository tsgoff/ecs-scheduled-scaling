var aws = require('aws-sdk');

exports.handler = (event, context, callback) => {
    var ecsCluster = event.cluster;
    var ecsRegion = event.region;
    var minCapacity = event.minCapacity;
    var maxCapacity = event.maxCapacity;
    var ecs = new aws.ECS({region: ecsRegion});
    var applicationautoscaling = new aws.ApplicationAutoScaling();
    for (const service in event.scaling) {
        ecs.describeServices({
            services: [service],
            cluster: ecsCluster
        }, function(err, data) {
            if (err) {
                console.log(err, err.stack);
            } else {
                var desiredCount = event.scaling[service];
                var ecsCluster = event.cluster;
                var params = {
                    service: service,
                    desiredCount: desiredCount,
                    cluster: ecsCluster
                };
                if (desiredCount) {
                    ecs.updateService(params, function(err, data) {
                        if (err) {
                            console.log(err, err.stack);
                        } else {
                            console.log(data);
                            context.succeed();
                        }
                    });
                }
            }
        });
        var params = {
            ResourceId: `service/${ecsCluster}/${service}`,
            ScalableDimension: 'ecs:service:DesiredCount',
            ServiceNamespace: 'ecs',
            MinCapacity: minCapacity,
            MaxCapacity: maxCapacity,
            SuspendedState: {
                DynamicScalingInSuspended: false,
                DynamicScalingOutSuspended: false,
                ScheduledScalingSuspended: false
            }
        };
        applicationautoscaling.registerScalableTarget(params, function(err, data) {
            if (err) console.log(err, err.stack);
            else console.log(data);
        });
    }
}
