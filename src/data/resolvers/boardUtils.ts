import { ActivityLogs, Boards, Conformities, Pipelines, Stages } from '../../db/models';
import { NOTIFICATION_TYPES } from '../../db/models/definitions/constants';
import { IDealDocument } from '../../db/models/definitions/deals';
import { IUserDocument } from '../../db/models/definitions/users';
import { can } from '../permissions/utils';
import { checkLogin } from '../permissions/wrappers';
import utils from '../utils';

export const notifiedUserIds = async (item: any) => {
  let userIds: string[] = [];

  userIds = userIds.concat(item.assignedUserIds || []);

  userIds = userIds.concat(item.watchedUserIds || []);

  const stage = await Stages.getStage(item.stageId);
  const pipeline = await Pipelines.getPipeline(stage.pipelineId);

  userIds = userIds.concat(pipeline.watchedUserIds || []);

  return userIds;
};

export interface IBoardNotificationParams {
  item: IDealDocument;
  user: IUserDocument;
  type: string;
  action?: string;
  content?: string;
  contentType: string;
  invitedUsers?: string[];
  removedUsers?: string[];
}

/**
 * Send notification to all members of this content except the sender
 */
export const sendNotifications = async ({
  item,
  user,
  type,
  action,
  content,
  contentType,
  invitedUsers,
  removedUsers,
}: IBoardNotificationParams) => {
  const stage = await Stages.getStage(item.stageId);

  const pipeline = await Pipelines.getPipeline(stage.pipelineId);

  const title = `${contentType} updated`;

  if (!content) {
    content = `${contentType} '${item.name}'`;
  }

  let route = '';

  if (contentType === 'ticket') {
    route = '/inbox';
  }

  const usersToExclude = [...(removedUsers || []), ...(invitedUsers || []), user._id];

  const notificationDoc = {
    createdUser: user,
    title,
    contentType,
    contentTypeId: item._id,
    notifType: type,
    action: action ? action : `has updated ${contentType}`,
    content,
    link: `${route}/${contentType}/board?id=${pipeline.boardId}&pipelineId=${pipeline._id}&itemId=${item._id}`,

    // exclude current user, invited user and removed users
    receivers: (await notifiedUserIds(item)).filter(id => {
      return usersToExclude.indexOf(id) < 0;
    }),
  };

  if (removedUsers && removedUsers.length > 0) {
    await utils.sendNotification({
      ...notificationDoc,
      notifType: NOTIFICATION_TYPES[`${contentType.toUpperCase()}_REMOVE_ASSIGN`],
      action: `removed you from ${contentType}`,
      content: `'${item.name}'`,
      receivers: removedUsers.filter(id => id !== user._id),
    });
  }

  if (invitedUsers && invitedUsers.length > 0) {
    await utils.sendNotification({
      ...notificationDoc,
      notifType: NOTIFICATION_TYPES[`${contentType.toUpperCase()}_ADD`],
      action: `invited you to the ${contentType}: `,
      content: `'${item.name}'`,
      receivers: invitedUsers.filter(id => id !== user._id),
    });
  }

  await utils.sendNotification({
    ...notificationDoc,
  });
};

export const itemsChange = async (userId: string, item: any, type: string, destinationStageId: string) => {
  const oldStageId = item ? item.stageId || '' : '';

  let action = `changed order of your ${type}:`;
  let content = `'${item.name}'`;

  if (oldStageId !== destinationStageId) {
    const stage = await Stages.getStage(destinationStageId);
    const oldStage = await Stages.getStage(oldStageId);

    const pipeline = await Pipelines.getPipeline(stage.pipelineId);
    const oldPipeline = await Pipelines.getPipeline(oldStage.pipelineId);

    const board = await Boards.getBoard(pipeline.boardId);
    const oldBoard = await Boards.getBoard(oldPipeline.boardId);

    action = `moved '${item.name}' from ${oldBoard.name}-${oldPipeline.name}-${oldStage.name} to `;

    content = `${board.name}-${pipeline.name}-${stage.name}`;

    const activityLogContent = {
      oldStageId,
      destinationStageId,
      text: `${oldStage.name} to ${stage.name}`,
    };

    ActivityLogs.createBoardItemMovementLog(item, type, userId, activityLogContent);
  }

  return { content, action };
};

export const boardId = async (item: any) => {
  const stage = await Stages.getStage(item.stageId);
  const pipeline = await Pipelines.getPipeline(stage.pipelineId);
  const board = await Boards.getBoard(pipeline.boardId);

  return board._id;
};

const PERMISSION_MAP = {
  deal: {
    boardsAdd: 'dealBoardsAdd',
    boardsEdit: 'dealBoardsEdit',
    boardsRemove: 'dealBoardsRemove',
    pipelinesAdd: 'dealPipelinesAdd',
    pipelinesEdit: 'dealPipelinesEdit',
    pipelinesRemove: 'dealPipelinesRemove',
    pipelinesWatch: 'dealPipelinesWatch',
  },
  ticket: {
    boardsAdd: 'ticketBoardsAdd',
    boardsEdit: 'ticketBoardsEdit',
    boardsRemove: 'ticketBoardsRemove',
    pipelinesAdd: 'ticketPipelinesAdd',
    pipelinesEdit: 'ticketPipelinesEdit',
    pipelinesRemove: 'ticketPipelinesRemove',
    pipelinesWatch: 'ticketPipelinesWatch',
  },
  task: {
    boardsAdd: 'taskBoardsAdd',
    boardsEdit: 'taskBoardsEdit',
    boardsRemove: 'taskBoardsRemove',
    pipelinesAdd: 'taskPipelinesAdd',
    pipelinesEdit: 'taskPipelinesEdit',
    pipelinesRemove: 'taskPipelinesRemove',
    pipelinesWatch: 'taskPipelinesWatch',
  },
  growthHack: {
    boardsAdd: 'growthHackBoardsAdd',
    boardsEdit: 'growthHackBoardsEdit',
    boardsRemove: 'growthHackBoardsRemove',
    pipelinesAdd: 'growthHackPipelinesAdd',
    pipelinesEdit: 'growthHackPipelinesEdit',
    pipelinesRemove: 'growthHackPipelinesRemove',
    pipelinesWatch: 'growthHackPipelinesWatch',
    templatesAdd: 'growthHackTemplatesAdd',
    templatesEdit: 'growthHackTemplatesEdit',
    templatesRemove: 'growthHackTemplatesRemove',
    templatesDuplicate: 'growthHackTemplatesDuplicate',
    showTemplates: 'showGrowthHackTemplates',
  },
};

export const checkPermission = async (type: string, user: IUserDocument, mutationName: string) => {
  checkLogin(user);

  const actionName = PERMISSION_MAP[type][mutationName];

  let allowed = await can(actionName, user);

  if (user.isOwner) {
    allowed = true;
  }

  if (!allowed) {
    throw new Error('Permission required');
  }

  return;
};

export const createConformity = async ({
  companyIds,
  customerIds,
  mainType,
  mainTypeId,
}: {
  companyIds?: string[];
  customerIds?: string[];
  mainType: string;
  mainTypeId: string;
}) => {
  for (const companyId of companyIds || []) {
    await Conformities.addConformity({
      mainType,
      mainTypeId,
      relType: 'company',
      relTypeId: companyId,
    });
  }

  for (const customerId of customerIds || []) {
    await Conformities.addConformity({
      mainType,
      mainTypeId,
      relType: 'customer',
      relTypeId: customerId,
    });
  }
};
