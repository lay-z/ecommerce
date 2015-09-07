# Set up instructions
Instructions are for machines running on linux

## Pre requisits
The server can only work in conjunction with ripple-rest and a rippled instance.
For more information on getting those set up, please see the relevant links:
- ripple-rest : https://github.com/ripple/ripple-rest
- rippled: https://ripple.com/build/rippled-apis/rippled-setup/

The ripple-rest must be pointing to the locally installed rippled instance.
Ripple-rest must also be accepting connections on port: 5990

Node (v0.10) must also be installed with npm (for more information on installation please see https://nodejs.org/en/)

## Set up instructions
1. Unpack archive into directory
2. Install relevant dependencies using ```npm install```

to run the server use the command

```npm start```
the server will listen by default on port 3000



