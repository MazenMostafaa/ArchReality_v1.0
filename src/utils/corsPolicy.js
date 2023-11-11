

let whitelist = ['http://example1.com', `${process.env.DEVELOPMENT_URL}`]


export let corsOptions = {
    origin: function (origin, callback) {

        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)

        } else {
            callback(new Error('Not allowed by CORS', { cause: 400 }))
        }
    }
}