import * as dotenv from 'dotenv';

dotenv.config({ path: `${__dirname}/../.env-personal` });
dotenv.config({ path: `${__dirname}/../.env` });

// start the server and all the subsequent loading of files after configuration is loaded
require('./server');
