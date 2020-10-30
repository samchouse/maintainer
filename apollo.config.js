module.exports = {
    client: {
        name: 'Apollo Client',
        service: {
            name: 'github',
            url: 'https://api.github.com/graphql',
            headers: {
                authorization:
                    'Bearer e2047580907410f11332c7b23706260c0b90155d',
                accept: 'application/vnd.github.antiope-preview+json'
            },
            includes: ['./src/graphql/queries']
        }
    }
};
