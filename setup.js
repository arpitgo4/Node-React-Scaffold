
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const backend_github_url = `https://github.com/arpitgo4/Express-MongoDB-Scaffold.git`;
const frontend_github_url = `https://github.com/arpitgo4/React-Redux-Scaffold.git`;
const github_backend_dir = `Express-MongoDB-Scaffold`;
const github_frontend_dir = `React-Redux-Scaffold`;
const backend_dir = 'server';
const frontend_dir = 'client';


const BINARY_CHECK_COMMANDS = [
    `git --version`,
];

const BINARY_COMMANDS = {
    SUPER_BASH: () => `sudo bash`,
    RENAME_DIR: (old_name, new_name) => `mv ${old_name} ${new_name}`,
    CLONE_GITHUB_REPO: repo_http_url => `git clone ${repo_http_url}`,
    // TODO: add sudo
    REMOVE_DIR: dir_name => dir_name ? `rm -rf ${dir_name}` : ``  ,
};

const checkForRequiredBinaries = () => {
    return Promise.all(BINARY_CHECK_COMMANDS.map(executeBinary));
};

const executeBinary = command => {
    return exec(command)
    .then(({ stdout, stderr, }) => {
        const regex = /\n/gi;
        stdout = stdout.replace(regex, '');

        // TODO: improve logging between stdout and stderr
        if (stdout)
            console.log(`[setup] ${stdout}`);
    })
    .then(() => {
        console.log(`[setup] Executed: ${command}`);
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
    });
};

main();