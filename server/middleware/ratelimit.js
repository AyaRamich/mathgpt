import rateLimit,{ipKeyGenerator} from 'express-rate-limit';

export const limiter = rateLimit({
    windowMs:60*1000,
    max:10,
    message: {error :'arrete de spammer , tu as depasse la limite'
    }
})
export const userLimiter = rateLimit({
    windowMs:60*1000,
    max:20,
    keyGenerator: (req) => req.userId || ipKeyGenerator(req.ip), message:{error:'limite atteinte pour votre compte'} 
}) 
