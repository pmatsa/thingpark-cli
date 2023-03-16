#!/usr/bin/env node

const { Command } = require('commander');
const loginAction = require('./actions/login');
const statusAction = require('./actions/status');

//Device
const { listDevices } = require('./actions/device/list');
const { updateDevices } = require('./actions/device/update');
const { deleteDevices } = require('./actions/device/delete');

//Gateway
const { listGateways } = require('./actions/gateway/list');

//Route
const { listRoutes } = require('./actions/route/list');

//Connection
const { listConnections } = require('./actions/connection/list');

const program = new Command();
program.version('1.0.0');

program
  .command('login')
  .description('Log in to Thingpark Enterprise')
  .action(loginAction);

program
  .command('status')
  .description('Check the status of your credentials')
  .action(statusAction);

const deviceCommand = new Command('device').description('Device commands');
deviceCommand
  .command('list')
  .description('List devices')
  .action(listDevices);

deviceCommand
  .command('update')
  .requiredOption('-c, --csv <csvPath>', 'Update must have a CSV file path')
  .description('Update devices with a CSV file')
  .action((options) => updateDevices(options));

deviceCommand
  .command('delete')
  .requiredOption('-c, --csv <csvPath>', 'Delete must have a CSV file path')
  .description('Delete devices (EUIs) with a CSV file')
  .action((options) => deleteDevices(options));

deviceCommand.on('command:*', function (operands) {
  console.error(`error: unknown command '${operands[0]}'`);
  const availableCommands = deviceCommand.commands.map((cmd) => cmd.name());
  console.log('Available commands: ', availableCommands.join(', '));
  process.exitCode = 1;
});

program.addCommand(deviceCommand);

const gatewayCommand = new Command('gateway').description('Gateway commands');
gatewayCommand
  .command('list')
  .description('List gateways')
  .action(listGateways);

gatewayCommand.on('command:*', function (operands) {
  console.error(`error: unknown command '${operands[0]}'`);
  const availableCommands = gatewayCommand.commands.map((cmd) => cmd.name());
  console.log('Available commands: ', availableCommands.join(', '));
  process.exitCode = 1;
});

program.addCommand(gatewayCommand);

const routeCommand = new Command('route').description('Route commands');
routeCommand
  .command('list')
  .description('List routes')
  .action(listRoutes);

routeCommand.on('command:*', function (operands) {
  console.error(`error: unknown command '${operands[0]}'`);
  const availableCommands = routeCommand.commands.map((cmd) => cmd.name());
  console.log('Available commands: ', availableCommands.join(', '));
  process.exitCode = 1;
});

program.addCommand(routeCommand);

const connectionCommand = new Command('connection').description('Connection commands');
connectionCommand
  .command('list')
  .description('List connections')
  .action(listConnections);

connectionCommand.on('command:*', function (operands) {
  console.error(`error: unknown command '${operands[0]}'`);
  const availableCommands = connectionCommand.commands.map((cmd) => cmd.name());
  console.log('Available commands: ', availableCommands.join(', '));
  process.exitCode = 1;
});

program.addCommand(connectionCommand);

program.parse(process.argv);