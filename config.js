module.exports = {
    env				: process.env.NODE_ENV === 'development' ? 'dev' : 'prod',
    app_name		: 'Example Job',
	grace_time		: 300,
	email_settings	: {
    	enabled: true,
		error: {
            to		: ['dev@example.com'],
            from	: 'Job Pipeline <no-reply@example.com>'
		}
	},
	lock_settings: {
    	file_path: './script.lock',
		grace_time: 300,
		release_max: 600
	},
}