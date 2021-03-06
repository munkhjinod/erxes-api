import * as moment from 'moment';
import {
  Brands,
  Channels,
  Companies,
  Customers,
  Deals,
  Fields,
  Permissions,
  Tasks,
  Tickets,
  Users,
} from '../../../db/models';
import { IUserDocument } from '../../../db/models/definitions/users';
import { MODULE_NAMES } from '../../constants';
import { can } from '../../permissions/utils';
import { createXlsFile, generateXlsx, paginate } from '../../utils';
import {
  filter as companiesFilter,
  IListArgs as ICompanyListArgs,
  sortBuilder as companiesSortBuilder,
} from '../coc/companies';
import {
  Builder as BuildQuery,
  IListArgs as ICustomerListArgs,
  sortBuilder as customersSortBuilder,
} from '../coc/customers';
import { fillCellValue, fillHeaders, IColumnLabel } from './spreadsheet';

// Prepares data depending on module type
const prepareData = async (query: any, user: IUserDocument): Promise<any[]> => {
  const { type } = query;

  let data: any[] = [];

  switch (type) {
    case MODULE_NAMES.COMPANY:
      if (!(await can('exportCompanies', user))) {
        throw new Error('Permission denied');
      }

      const companyParams: ICompanyListArgs = query;

      const selector = await companiesFilter(companyParams);
      const sorter = companiesSortBuilder(companyParams);

      data = await paginate(Companies.find(selector), companyParams).sort(sorter);

      break;
    case MODULE_NAMES.CUSTOMER:
      if (!(await can('exportCustomers', user))) {
        throw new Error('Permission denied');
      }

      const customerParams: ICustomerListArgs = query;

      const qb = new BuildQuery(customerParams);

      await qb.buildAllQueries();

      const sort = customersSortBuilder(customerParams);

      data = await Customers.find(qb.mainQuery()).sort(sort);

      break;
    case MODULE_NAMES.DEAL:
      if (!(await can('exportDeals', user))) {
        throw new Error('Permission denied');
      }

      data = await Deals.find();

      break;
    case MODULE_NAMES.TASK:
      if (!(await can('exportTasks', user))) {
        throw new Error('Permission denied');
      }

      data = await Tasks.find();

      break;
    case MODULE_NAMES.TICKET:
      if (!(await can('exportTickets', user))) {
        throw new Error('Permission denied');
      }

      data = await Tickets.find();

      break;
    case MODULE_NAMES.USER:
      if (!(await can('exportUsers', user))) {
        throw new Error('Permission denied');
      }

      data = await Users.find({ isActive: true });

      break;
    case MODULE_NAMES.PERMISSION:
      if (!(await can('exportPermissions', user))) {
        throw new Error('Permission denied');
      }

      data = await Permissions.find();

      break;
    case MODULE_NAMES.BRAND:
      if (!(await can('exportBrands', user))) {
        throw new Error('Permission denied');
      }

      data = await Brands.find();

      break;
    case MODULE_NAMES.CHANNEL:
      if (!(await can('exportChannels', user))) {
        throw new Error('Permission denied');
      }

      data = await Channels.find();

      break;
    default:
      break;
  }

  return data;
};

export const buildFile = async (query: any, user: IUserDocument): Promise<{ name: string; response: string }> => {
  const { type } = query;

  const data = await prepareData(query, user);
  const headers: IColumnLabel[] = fillHeaders(type);

  // Reads default template
  const { workbook, sheet } = await createXlsFile();

  const columnNames: string[] = [];
  let rowIndex: number = 1;

  const addCell = (col: IColumnLabel, value: string): void => {
    // Checking if existing column
    if (columnNames.includes(col.name)) {
      // If column already exists adding cell
      sheet.cell(rowIndex, columnNames.indexOf(col.name) + 1).value(value);
    } else {
      // Creating column
      sheet.cell(1, columnNames.length + 1).value(col.label || col.name);
      // Creating cell
      sheet.cell(rowIndex, columnNames.length + 1).value(value);

      columnNames.push(col.name);
    }
  };

  for (const item of data) {
    rowIndex++;

    // Iterating through basic info columns
    for (const column of headers) {
      const cellValue = await fillCellValue(column.name, item);

      addCell(column, cellValue);
    }

    if (type === MODULE_NAMES.CUSTOMER || type === MODULE_NAMES.COMPANY) {
      // Iterating through coc custom properties
      if (item.customFieldsData) {
        const keys = Object.getOwnPropertyNames(item.customFieldsData) || [];

        for (const fieldId of keys) {
          const propertyObj = await Fields.findOne({ _id: fieldId });

          if (propertyObj && propertyObj.text) {
            addCell({ name: propertyObj.text, label: propertyObj.text }, item.customFieldsData[fieldId]);
          }
        }
      }
    } // customer or company checking
  } // end items for loop

  return {
    name: `${type} - ${moment().format('YYYY-MM-DD HH:mm')}`,
    response: await generateXlsx(workbook),
  };
};
