import chalk from 'chalk';

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function textColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'success':
      return 'green';
    case 'info':
      return 'blue';
    case 'note':
      return 'white';
    case 'warning':
      return 'yellow';
    case 'error':
      return 'red';
    default:
      return 'red';
  }
}

function bgColor(severity: string) {
  const color = textColor(severity);
  return 'bg' + capitalizeFirstLetter(color);
}

function formatTitle(severity: string, message: string) {
  return chalk[bgColor(severity)].black('', message, '');
}

function formatText(severity: string, message: string) {
  return chalk[textColor(severity)](message);
}

export default function title(
  severity: string,
  title: string,
  subtitle: string,
) {
  const date = new Date();
  const dateString = chalk.grey(date.toLocaleTimeString());
  const titleFormatted = formatTitle(severity, title);
  const subTitleFormatted = formatText(severity, subtitle);
  const message = `${titleFormatted} ${subTitleFormatted}`;

  // In test environment we don't include timestamp
  if (process.env.NODE_ENV === 'test') {
    console.log(message);
    console.log();
    return;
  }

  // // Make timestamp appear at the end of the line
  // let logSpace =
  //   // process.stdout.columns - stringWidth(message) - stringWidth(dateString);
  // if (logSpace <= 0) {
  //   logSpace = 10;
  // }

  console.log(`${message}${dateString}`);
  console.log();
}
