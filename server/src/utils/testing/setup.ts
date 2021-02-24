import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';

dotenv.config({ path: `${__dirname}/../../../.env-personal` });
dotenv.config({ path: `${__dirname}/../../../.env` });

chai.use(chaiAsPromised);
