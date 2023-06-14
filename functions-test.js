#! /usr/bin/env node
import { Client, Databases, Functions, ID, InputFile, Permission, Role, Storage } from 'node-appwrite';
import webpush from 'web-push';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectId = "6480a9e5ce28a912cb4a";
const apiKey = "22b7004ad099b648b721e086ddaf51bc95382f4c407638a41ec55f08c8ac431ce04e76f150fa275538e032407b8740efec9fe7da9fd194710f2a12d4198c90f2ddf2ea2f79d06c8881d51acdcdf1ce9dea8a3f0de8ff1d986d6fd3b4b511fc7757ea0638226a8addf2a1552b3efebe6a5edf68d49b132ba506080621af174af2";

const client = new Client();
const functions = new Functions(client);

client.setEndpoint('https://cloud.appwrite.io/v1');
client.setProject(projectId);
client.setKey(apiKey);

async function test() {
  console.log('Deploying functions test...');

  const keys = webpush.generateVAPIDKeys();
  const {publicKey, privateKey} = keys;
  
  await functions.create(
    'getVapidPublicKey',
    'getVapidPublicKey',
    'node-16.0',
    [
      Role.users()
    ]
  );

  await functions.createVariable(
    'getVapidPublicKey',
    'vapidPublicKey',
    publicKey
  );

  await functions.createDeployment(
    'getVapidPublicKey',
    'functions/getVapidPublicKey/index.js',
    InputFile.fromPath(__dirname + '/functions/getVapidPublicKey.tar.gz', 'getVapidPublicKey.tar.gz'),
    true
  );

  await functions.create(
    'watchNewMessages',
    'watchNewMessages',
    'node-16.0',
    [],
    [
      `databases.chat.collections.messages.documents.*.create`
    ]
  );

  await Promise.all([
    functions.createVariable(
      'watchNewMessages',
      'apiKey',
      apiKey
    ),
    functions.createVariable(
      'watchNewMessages',
      'vapidPublicKey',
      publicKey
    ),
    functions.createVariable(
      'watchNewMessages',
      'vapidPrivateKey',
      privateKey
    )
  ]);

  await functions.createDeployment(
    'watchNewMessages',
    'functions/watchNewMessages/index.js',
    InputFile.fromPath(__dirname + '/functions/watchNewMessages.tar.gz', 'watchNewMessages.tar.gz'),
    true
  );

  console.log('done.');
}

test();