import env from './env';

export const loginLabels = {
  noResponse: 'There was an error contacting the website. Please refresh your browser and try again.',
  serverError: `There was an error with the server while trying to login. If this error persists, please email ${env.var.EMAIL_ADMIN}`,
  authFail: 'We were not able to sign you in. Please verify your information and try again',
  otpRequired: 'Enter the code from your authenticator app',
  authSuccess: 'You\'re signed in. We are redirecting you to your account now',
  applicantAuthSuccess: 'We\'ve located your application and are loading it now',
  applicantAuthFail: 'We were not able to find an application matching that information',
  notValidEmail: 'The provided email address was not in a valid email format.',
  userRequestedEndpoint: (userId: number, route: string) => `User ${userId} requested ${route}`,
};
