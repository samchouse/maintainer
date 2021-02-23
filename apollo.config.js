module.exports = {
    client: {
        name: 'Apollo Client',
        service: {
            name: 'github',
            url: 'https://api.github.com/graphql',
            headers: {
                authorization:
                    'Bearer 3d0670217bbe876905e96385bba2742cb22cc96c',
                accept: 'application/vnd.github.antiope-preview+json'
            },
            includes: ['./src/graphql/queries']
        }
    }
};
