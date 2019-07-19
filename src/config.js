process.env.TZ = 'UTC';

module.exports = {
  CAI_SERVICE_NAME: 'iamconversationalai',
  DB_CREDENTIALS_SERVICE_NAME: 'amsdbcredentials',
  DEFAULT_CLIENT: '100',
  LAUNCHPAD_APP_URL: 'https://fiorilaunchpad.sap.com/sites#arm-Create&/createRequest/prefilled',
  MY_AUTHORIZATION_LINK:'https://fiorilaunchpad.sap.com/sites#arm-Create&/myAuthorizations',
  MY_SUBSTITUTE_LINK:'https://fiorilaunchpad.sap.com/sites?hc_reset#mydelegates-Display',
  MY_AUTHHISTORY_LINK:'https://fiorilaunchpad.sap.com/sites?hc_reset#arm-Create&/detail',
  MULTI_ACCESS_LINK: 'https://fiorilaunchpad.sap.com/sites#access-approve&/listApprovers',
  SERVICE_NAME_LINK:'https://jam4.sapjam.com/groups/O44DvPsGH6fPFhSDlWR2ZN/overview_page/30vh45xkYKorAffug408dH',
  LOCALES: ['en'],
  LOCALES_DIR: __dirname + '/locales',
  MAXEDITDISTANCE: 3,
  PASSWORD_RESET_LINK: 'https://uap.wdf.sap.corp/sap/bc/webdynpro/sap/yupa_pw_self_service?sap-language=EN',
  PG_DESTINATION: 'PGP_ARM_REQUEST_SRV', //'PGP_ARM_REQUEST_SRV', //'int_pg',
  REQUEST_TIMEOUT: 8000
}
