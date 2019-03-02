
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const backend_github_url = `https://github.com/arpitgo4/Express-MongoDB-Scaffold.git`;
const frontend_github_url = `https://github.com/arpitgo4/React-Redux-Scaffold.git`;
const github_backend_dir = `Express-MongoDB-Scaffold`;
const github_frontend_dir = `React-Redux-Scaffold`;
const backend_dir = `server`;
const frontend_dir = `client`;


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
    .then(({ stdout, stderr, }) => {
        const regex = /\n/gi;
        stdout = stdout.replace(regex, '');

        // TODO: improve logging between stdout and stderr
        // if (stdout)
        //     console.log(`[setup] ${stdout}`);
    })
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


const main = () => {
    // need super user permissions (only for deleting dirs)
    // return executeBinary(BINARY_COMMANDS.SUPER_BASH())
    // .then(checkForRequiredBinaries)
    
    return checkForRequiredBinaries()
    .then(() => Promise.all([
        cloneGithubRepo(backend_github_url),
        cloneGithubRepo(frontend_github_url),
    ]))
    .then(() => Promise.all([
        renameDir(github_backend_dir, backend_dir),
        renameDir(github_frontend_dir, frontend_dir),
    ]))
    .catch(err => console.log(`[setup] Error: ${err.message}`))
    .then(() => {
        console.log(`[setup] Removing directories`);
        return Promise.all([
            removeDir(github_backend_dir),
            removeDir(github_frontend_dir),
            removeDir(backend_dir),
            removeDir(frontend_dir),
        ]);
    })
    .then(() => {
        console.log(`\nTo start project:\n$ cd deployment/development && docker-compose up --build`);
    });
};

main();