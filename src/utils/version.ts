import cp from 'child_process'

const getGitVersion = () => {
  return new Promise<string>((resolve, reject) => {
    cp.exec(
      'git describe --abbrev=0',
      { encoding: 'utf-8' },
      (error, stdout) => {
        error ? reject(error) : resolve(stdout)
      }
    )
  })
}

export { getGitVersion }
