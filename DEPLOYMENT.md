# Setting up Firebase

- run `yarn add -g firebase-tools`

# Manually deploying the contents of the build folder

- run `yarn run build copy test`
- run `firebase deploy --only=hosting`

# Generating a new Token for Travis
See https://docs.travis-ci.com/user/deployment/firebase/