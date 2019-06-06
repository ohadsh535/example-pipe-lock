const argv = require('minimist')(process.argv.slice(2));
const _ = require('lodash');
const fs = require('fs-extra');

const {
	env,
	app_name,
	email_settings,
    lock_settings
} = require('./config');

const dev = env !== 'prod';

/* Utils  */
const logv = function (...log) {
	if (argv['v'])
		console.log(log.join(', '));
};
const color = function (str) {
	return `\x1b[33m\x1B[1m${str}\x1B[22m\x1b[0m`;
};
function notifyEmail() {
	return new Promise((res, reject) => {
		// @todo - Write some smtp implementation here.
	})
}

/**
 * Script Lock. Check if a previous run has not been completed.
 *
 * @type {() => Promise<any>}
 */
function checkLock() {
	const now = new Date().getTime();

	return fs.pathExists(lock_settings.file_path)
        .then(exists => {
        	if (!exists) {
                logv('Lock does not exists');
                return createLock(now);
			}

			validateLock(now);
			throw new Error(`Lock in place - prior run yet to complete.`)
        });
};

function createLock(lockTime) {
	return fs.writeFile(lock_settings.file_path, lockTime);
}

function validateLock(lockTime) {
    const lockFileContents = fs.readFileSync(lock_settings.file_path, 'utf8');
    const secondsLocked = (lockTime - lockFileContents)/1000;

    const msg = `Pipe has been locked for ${secondsLocked} seconds.`
    logv(msg);
    if (secondsLocked > lock_settings.grace_time) {
        let sesOpt = _.merge(
            email_settings.error,
            {
                subject: `*${app_name}* Pipe locked`,
                message: msg,
            }
        );
        notifyEmail(sesOpt);
        if (secondsLocked > lock_settings.release_max)
            return fs.remove(lock_settings.file_path);
    }
}

function delayCounter(timeoutInterval) {
	return new Promise((resolve, reject) => {
		let c = 0;
		const sampleInterval = setInterval(() => {
			c++;
			logv(c);
			if (c === timeoutInterval) {
                clearInterval(sampleInterval)
                return resolve();
			}

		}, 1000)
	})
}

const execute = async function () {
	const errors = [];
	const countTo = argv['c'] || 10
	logv(`*${app_name}*`);
	logv(`Counts to ${countTo}`);
	logv(`Lock grace time: ${lock_settings.grace_time} seconds.`);
	logv(`Lock force release time: ${lock_settings.release_max} seconds.`);
	logv(`-------------`);
	try {
		// Check if lock in place prevents execution.
		await checkLock();

		// Execute your heavy lifting.
		// @todo - Write some meaningful tasks.
		await delayCounter(10);

		// Remove Lock after finishing process.
        await fs.remove(lock_settings.file_path);
	}
	catch (error) {
		errors.push(error);
	}

	logv(color('\nDone Processing!'));

	if (errors.length > 0) {
		console.error(`Finished with errors:\n${errors.join('\n')}`);

		if (email_settings.enabled) {
			const sesOpt = _.merge(
                email_settings.error,
				{
					subject: `*${app_name}* encountered ${errors.length} errors`,
					message: `<b>Execution params: </b>${JSON.stringify(argv)}<br/><b>Errors: </b><br/>${errors.map((el, idx) => `${idx+1}. ${el}`)}.join('<br/>')`,
				}
			);

			notifyEmail(sesOpt).catch();
		}
	}
};

execute().catch(console.error);