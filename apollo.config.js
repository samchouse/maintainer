module.exports = {
    client: {
        name: 'Apollo Client',
        service: {
            name: 'github',
            url: 'https://api.github.com/graphql',
            headers: {
                authorization: `Bearer 234ed6dd788eb47a3c86d066f3b759717ab8838b`,
                accept: 'application/vnd.github.antiope-preview+json'
            },
            includes: ['./src/graphql/queries']
        }
    }
};
