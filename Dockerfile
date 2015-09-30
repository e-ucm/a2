FROM node

ENV REPO_URL="https://github.com/e-ucm/a2" \
    REPO_TAG="master" \
    USER_NAME="user" \
    WORK_DIR="/app"

# setup user & group
RUN groupadd -r "$USER_NAME" \
    && useradd -r -g "$USER_NAME" "$USER_NAME"

# retrieve sources & setup workdir
RUN mkdir ${WORK_DIR} \
  && cd ${WORK_DIR} \
  && git clone -b "$REPO_TAG" --single-branch "$REPO_URL" .
WORKDIR ${WORK_DIR}

# get dependencies sorted out
RUN npm install

# configure & gen apidoc
RUN npm run fast-setup \
    && npm run gen-apidoc

# expose & run
EXPOSE 3000
CMD [ "npm", "run", "docker-start" ]

# EXPECTS: Mongo at 27017, Redis at 6379
