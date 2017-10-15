import faker from 'faker';
import Random from 'meteor-random';
import { MODULES } from '../data/constants';

import {
  Users,
  Brands,
  EmailTemplates,
  ResponseTemplates,
  InternalNotes,
  Customers,
  Forms,
  FormFields,
  Fields,
  Segments,
  Companies,
  Integrations,
  Tags,
  NotificationConfigurations,
  Notifications,
} from './models';

export const userFactory = (params = {}) => {
  const user = new Users({
    username: params.username || faker.random.word(),
    details: {
      fullName: params.fullName || faker.random.word(),
    },
  });

  return user.save();
};

export const brandFactory = (params = {}) => {
  const brand = new Brands({
    name: faker.random.word(),
    code: params.code || faker.random.word(),
    userId: () => Random.id(),
    description: params.description || faker.random.word(),
    emailConfig: {
      type: 'simple',
      template: faker.random.word(),
    },
  });

  return brand.save();
};

export const emailTemplateFactory = (params = {}) => {
  const emailTemplate = new EmailTemplates({
    name: faker.random.word(),
    content: params.content || faker.random.word(),
  });

  return emailTemplate.save();
};

export const responseTemplateFactory = (params = {}) => {
  const responseTemplate = new ResponseTemplates({
    name: faker.random.word(),
    content: params.content || faker.random.word(),
    brandId: params.brandId || Random.id(),
    files: [faker.random.image()],
  });

  return responseTemplate.save();
};

export const segmentFactory = (params = {}) => {
  const defaultConditions = [
    {
      field: 'messengerData.sessionCount',
      operator: 'e',
      value: '10',
      dateUnit: 'days',
      type: 'string',
    },
  ];

  const segment = new Segments({
    name: faker.random.word(),
    description: params.description || faker.random.word(),
    subOf: params.subOf || 'DFSAFDFDSFDSF',
    color: params.color || '#ffff',
    connector: params.connector || 'any',
    conditions: params.conditions || defaultConditions,
  });

  return segment.save();
};

export const internalNoteFactory = (params = {}) => {
  const internalNote = new InternalNotes({
    contentType: params.contentType || 'customer',
    contentTypeId: params.contentTypeId || 'DFASFDFSDAFDF',
    content: params.content || faker.random.word(),
  });

  return internalNote.save();
};

export const companyFactory = (params = {}) => {
  const company = new Companies({
    name: params.name || faker.random.word(),
    size: params.size || faker.random.number(),
    industry: params.industry || Random.id(),
    website: params.website || Random.id(),
  });

  return company.save();
};

export const customerFactory = (params = {}) => {
  const customer = new Customers({
    name: params.name || faker.random.word(),
    email: params.email || faker.internet.email(),
    phone: params.phone || faker.random.word(),
    messengerData: params.messengerData || {},
    customFieldsData: params.customFieldsData || {},
  });

  return customer.save();
};

export const fieldFactory = (params = {}) => {
  const field = new Fields({
    type: params.type || 'input',
    validation: params.validation || 'number',
    text: params.text || faker.random.word(),
    description: params.description || faker.random.word(),
    isRequired: params.isRequired || false,
    order: params.order || 0,
  });

  return field.save();
};

export const integrationFactory = params => {
  const kind = params.kind || 'messenger';
  return Integrations.create({
    name: faker.random.word(),
    kind: kind,
    brandId: params.brandId || Random.id(),
    formId: params.formId || Random.id(),
    messengerData: params.messengerData || { welcomeMessage: 'welcome' },
    formData:
      params.formData === 'form'
        ? params.formData
        : kind === 'form' ? { thankContent: 'thankContent' } : null,
  });
};

export const tagsFactory = (params = {}) => {
  const tag = new Tags({
    name: faker.random.word(),
    type: params.type || faker.random.word(),
    colorCode: params.colorCode || Random.id(),
    userId: Random.id(),
  });

  return tag.save();
};

export const formFactory = async ({ title, code, description, createdUserId }) => {
  return Forms.createForm(
    {
      title: title || faker.random.word(),
      description: description || faker.random.word(),
      code: code || Random.id(),
    },
    createdUserId || (await userFactory({})),
  );
};

export const formFieldFactory = (formId, params) => {
  return FormFields.createFormField(formId || Random.id(), {
    type: params.type || 'input',
    name: faker.random.word(),
    validation: params.validation || 'number',
    text: faker.random.word(),
    description: faker.random.word(),
    isRequired: params.isRequired || false,
    number: faker.random.word(),
  });
};

export const notificationConfigurationFactory = params => {
  let { isAllowed } = params;
  if (isAllowed == null) {
    isAllowed = true;
  }

  return NotificationConfigurations.createOrUpdateConfiguration(
    {
      notifType: params.notifType || MODULES.CHANNEL_MEMBERS_CHANGE,
      // which module's type it is. For example: indocuments
      isAllowed,
    },
    params.user || userFactory({}),
  );
};

export const notificationFactory = params => {
  return Notifications.createNotification({
    notifType: params.notifType || MODULES.CHANNEL_MEMBERS_CHANGE,
    createdUser: params.createdUser || userFactory({}),
    title: params.title || 'new Notification title',
    content: params.content || 'new Notification content',
    link: params.link || 'new Notification link',
    receiver: params.receiver || userFactory({}),
  });
};
