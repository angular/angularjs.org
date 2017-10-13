# Setting up Firebase

- run `yarn add -g firebase-tools`

# Manually deploying the contents of the build folder

(You need to be logged in and have access to the project)

- run `yarn run build`
- run `firebase deploy --only=hosting`

# Generating a new Token for Travis
See https://docs.travis-ci.com/user/deployment/firebase/