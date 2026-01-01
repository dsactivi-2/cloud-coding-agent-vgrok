/**
 * Slack Service - Notifications
 */

import { SlackMessage, Task } from '../types/index.js';

/**
 * Send a message to Slack webhook
 */
export async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === 'https://hooks.slack.com/services/...') {
    console.log('[Slack] No webhook configured, skipping notification');
    console.log('[Slack] Message:', message.text);
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      console.error('[Slack] Failed to send message:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Slack] Error sending message:', error);
    return false;
  }
}

/**
 * Notify task started
 */
export async function notifyTaskStarted(task: Task): Promise<void> {
  await sendSlackMessage({
    text: `🚀 *Task Started*: ${task.id}`,
    attachments: [{
      color: '#3498db',
      title: task.description,
      text: `Type: ${task.type}\nStatus: ${task.status}`
    }]
  });
}

/**
 * Notify task completed
 */
export async function notifyTaskCompleted(task: Task): Promise<void> {
  await sendSlackMessage({
    text: `✅ *Task Completed*: ${task.id}`,
    attachments: [{
      color: '#2ecc71',
      title: task.description,
      text: task.result?.substring(0, 200) || 'No result'
    }]
  });
}

/**
 * Notify task failed
 */
export async function notifyTaskFailed(task: Task): Promise<void> {
  await sendSlackMessage({
    text: `❌ *Task Failed*: ${task.id}`,
    attachments: [{
      color: '#e74c3c',
      title: task.description,
      text: task.error || 'Unknown error'
    }]
  });
}

/**
 * Send Q&A notification (ask user for input)
 */
export async function askQuestion(question: string, taskId: string): Promise<void> {
  await sendSlackMessage({
    text: `❓ *Question for Task ${taskId}*`,
    attachments: [{
      color: '#f39c12',
      title: 'VGrok needs your input',
      text: question
    }]
  });
}
