export const types = `
  type Integration {
    _id: String!
    kind: String!
    name: String!
    brandId: String!
    languageCode: String
    code: String
    formId: String
    tagIds: [String]
    tags: [Tag]
    leadData: JSON
    messengerData: JSON
    uiOptions: JSON
    isActive: Boolean

    brand: Brand
    form: Form
    channels: [Channel]
  }

  type integrationsTotalCount {
    total: Int
    byTag: JSON
    byChannel: JSON
    byBrand: JSON
    byKind: JSON
  }

  type integrationsGetUsedTypes {
    _id: String
    name: String
  }

  input IntegrationLeadData {
    loadType: String
    successAction: String
    fromEmail: String,
    userEmailTitle: String
    userEmailContent: String
    adminEmails: [String]
    adminEmailTitle: String
    adminEmailContent: String
    thankContent: String
    redirectUrl: String
    themeColor: String
    callout: JSON,
    rules: [InputRule]
  }

  input MessengerOnlineHoursSchema {
    _id: String
    day: String
    from: String
    to: String
  }

  input IntegrationLinks {
    twitter: String
    facebook: String
    youtube: String
  }

  input IntegrationMessengerData {
    _id: String
    notifyCustomer: Boolean
    availabilityMethod: String
    isOnline: Boolean,
    onlineHours: [MessengerOnlineHoursSchema]
    timezone: String
    messages: JSON
    knowledgeBaseTopicId: String
    links: IntegrationLinks
    supporterIds: [String]
    requireAuth: Boolean
    showChat: Boolean
    showLauncher: Boolean
    forceLogoutWhenResolve: Boolean
  }

  input MessengerUiOptions {
    color: String
    wallpaper: String
    logo: String
  }
`;

export const queries = `
  integrations(
    page: Int,
    perPage: Int,
    kind: String,
    searchValue: String,
    channelId: String,
    brandId: String,
    tag: String
  ): [Integration]

  integrationsGetUsedTypes: [integrationsGetUsedTypes]

  integrationDetail(_id: String!): Integration
  integrationsTotalCount: integrationsTotalCount
  integrationsFetchApi(path: String!, params: JSON!): JSON
`;

export const mutations = `
  integrationsCreateMessengerIntegration(
    name: String!,
    brandId: String!,
    languageCode: String
    ): Integration

  integrationsEditMessengerIntegration(
    _id: String!,
    name: String!,
    brandId: String!,
    languageCode: String
  ): Integration

  integrationsSaveMessengerAppearanceData(
    _id: String!,
    uiOptions: MessengerUiOptions): Integration

  integrationsSaveMessengerConfigs(
    _id: String!,
    messengerData: IntegrationMessengerData): Integration

  integrationsCreateLeadIntegration(
    name: String!,
    brandId: String!,
    languageCode: String,
    formId: String!,
    leadData: IntegrationLeadData!): Integration

  integrationsEditLeadIntegration(
    _id: String!
    name: String!,
    brandId: String!,
    languageCode: String,
    formId: String!,
    leadData: IntegrationLeadData!): Integration

  integrationsCreateExternalIntegration(
    kind: String!,
    name: String!,
    brandId: String!,
    accountId: String,
    data: JSON): Integration

  integrationsEditCommonFields(_id: String!, name: String!, brandId: String!): Integration

  integrationsRemove(_id: String!): JSON
  integrationsRemoveAccount(_id: String!): JSON

  integrationsArchive(_id: String!): Integration

  integrationSendMail(
    erxesApiId: String!
    subject: String!
    body: String
    to: [String]!
    cc: [String]
    bcc: [String]
    from: String!
    shouldResolve: Boolean
    headerId: String
    threadId: String
    messageId: String
    replyToMessageId: String
    kind: String
    references: String
    attachments: [JSON]
  ): JSON

  integrationAddImapAccount(
    email: String!
    password: String!
    imapHost: String!
    imapPort: Int!
    smtpHost: String!
    smtpPort: Int!
    kind: String!
  ): JSON

  integrationAddMailAccount(
    email: String!
    password: String!
    kind: String!
  ): JSON
`;
