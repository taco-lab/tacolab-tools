# How to contribute
We'd love to accept your patches and contributions to this project. There are just a few small guidelines you need to follow.

## Development setup
```
git clone <your_forked_repo>
cd tacolab-tools # navigate to your local repository
npm link
npm run build:watch
```
Now, whenever you run the `tacolab` command, it is executing against the code in your working directory. This is great for manual testing.