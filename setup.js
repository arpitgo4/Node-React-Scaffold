
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const rl = readline.createInterface({
    input: process.stdin, 
    output: process.stdout,
});

const backend_github_url = `https://github.com/arpitgo4/Express-MongoDB-Scaffold.git`;
const frontend_github_url = `https://github.com/arpitgo4/React-Redux-Scaffold.git`;
const github_backend_dir = `Express-MongoDB-Scaffold`;
const github_frontend_dir = `React-Redux-Scaffold`;
const backend_dir = `server`;
const frontend_dir = `client`;

const print_banner = () => {
    console.info(`Node-React-Scaffold`);
    const required_binaries = BINARY_CHECK_COMMANDS.map(c => c.split(' ')[0]);
    console.info(`Dependencies for the scaffold: ${required_binaries.join(', ')}`);
    console.info(`\n`);
};

const BINARY_CHECK_COMMANDS = [
    `git --version`,
    `docker -v`,
    `docker-compose -v`,
];

const BINARY_COMMANDS = {
    SUPER_BASH: () => `sudo bash`,
    RENAME_DIR: (old_name, new_name) => `mv ${old_name} ${new_name}`,
    CLONE_GITHUB_REPO: repo_http_url => `git clone ${repo_http_url}`,
    REMOVE_DIR: dir_name => dir_name ? `sudo rm -rf ${dir_name}` : ``,
    CD_DIR: path => `cd ${path}`,
};

const checkForRequiredBinaries = () => {
    return Promise.all(BINARY_CHECK_COMMANDS.map(check_command => {
        const [ binary ] = check_command.split(` `);

        return executeBinary(check_command, false)
        .then(() => {
            console.info(`[setup] ${binary} found in $PATH`);
        })
        .catch(err => {
            console.error(`[setup] ${binary} not found in $PATH`);
            return Promise.reject(err);
        });
    }));
};

const executeBinary = (command, log_output = true) => {
    if (log_output)
        console.info(`[setup] Executing: ${command}`);

    return exec(command)
    .catch(err => {
        console.log(`[setup] Error executing: ${command}`);
        return Promise.reject({ message: err.message });
    });
};

const renameDir = (old_name, new_name) => {
    const cmd = BINARY_COMMANDS.RENAME_DIR(old_name, new_name);
    return executeBinary(cmd);
};

const removeDir = dir_name => {
    const cmd = BINARY_COMMANDS.REMOVE_DIR(dir_name);
    return executeBinary(cmd);
};

const cloneGithubRepo = repo_http_url => {
    const cmd = BINARY_COMMANDS.CLONE_GITHUB_REPO(repo_http_url);
    return executeBinary(cmd);
};

const checkIfDirExists = dir_name => {
    const p = path.resolve(dir_name);
    return fs.existsSync(p);
};

const main = () => {
    const [ _, __, dev_mode ] = process.argv;
    let create_backend = true;
    let create_frontend = true;

    print_banner();

    return new Promise(resolve => {
        const backend_exists = checkIfDirExists(backend_dir) || checkIfDirExists(github_backend_dir);

        if (!backend_exists)
           return resolve();

        rl.question(`[setup] Backend setup already exists, enter (Y/n) to overwrite: `, answer => {
            if (answer === 'Y') {
                return resolve(Promise.all([
                    removeDir(github_backend_dir),
                    removeDir(backend_dir),
                ]));
            } else {
                create_backend = false;
                return resolve();
            }
        });
    })
    .then(() => new Promise(resolve => {
        const frontend_exists = checkIfDirExists(frontend_dir) || checkIfDirExists(github_frontend_dir);

        if (!frontend_exists) 
            return resolve();

        rl.question(`[setup] Frontend setup already exists, enter (Y/n) to overwrite: `, answer => {
            rl.close();

            if (answer === 'Y') {
                return resolve(Promise.all([
                    removeDir(github_frontend_dir),
                    removeDir(frontend_dir)
                ]));
            } else {
                create_frontend = false;
                return resolve();
            }
        });
    }))
    .then(checkForRequiredBinaries)
    .then(() => Promise.all([
        create_backend ? cloneGithubRepo(backend_github_url) : Promise.resolve(),
        create_frontend ? cloneGithubRepo(frontend_github_url) : Promise.resolve(),
    ]))
    .then(() => Promise.all([
        create_backend ? renameDir(github_backend_dir, backend_dir) : Promise.resolve(),
        create_frontend ? renameDir(github_frontend_dir, frontend_dir) : Promise.resolve(),
    ]))
    .then(() => Promise.all([
        create_backend ? removeDir(`${backend_dir}/.git`) : Promise.resolve(),
        create_frontend ? removeDir(`${frontend_dir}/.git`) : Promise.resolve(),        
    ]))
    .then(() => {
        if (!dev_mode)
            return Promise.resolve();

        console.log(`[setup] Removing directories [dev mode]`);
        return Promise.all([
            removeDir(github_backend_dir),
            removeDir(github_frontend_dir),
            removeDir(backend_dir),
            removeDir(frontend_dir),
        ]);
    })
    .then(() => {
        console.log(`\nTo start development:\n$ cd deployment/development && docker-compose up --build`);
        rl.close();
    })
    .catch(err => console.error(`Error Occured: ${err.message}`));
};

main();