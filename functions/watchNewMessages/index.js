const webpush = require('web-push');
const {Client, Databases, Query: q, ID, Permission, Role} = require('node-appwrite');

module.exports = async (req, res) => {
  const client = new Client();
  const dbs = new Databases(client);
  const {APPWRITE_FUNCTION_PROJECT_ID: projectId, apiKey, vapidPublicKey, vapidPrivateKey, adminEmail} = req.variables;
  const {message, posted_at, user_id, tagged_user_ids, from_user_avatar_url} = JSON.parse(req.variables.APPWRITE_FUNCTION_EVENT_DATA);

  client.setEndpoint('https://cloud.appwrite.io/v1');
  client.setProject(projectId);
  client.setKey(apiKey);

  if (tagged_user_ids && tagged_user_ids.length > 0) {
    const fromProfileData = await dbs.listDocuments(
      'chat',
      'profiles',
      [ q.equal('auth_id', [user_id]) ]
    );
    const [fromProfile] = fromProfileData.documents;
    let notificationPromises = [];
    let notificationPromisesDB = [];
    // const avatar_url = await storage.getFileView('profile_pictures', fromProfile.avatar_id);

    webpush.setVapidDetails(
      `mailto:${adminEmail}`,
      vapidPublicKey,
      vapidPrivateKey
    );

    const notification = JSON.stringify({
      username: fromProfile.username,
      message: message,
      posted_at: posted_at,
      avatar_url: from_user_avatar_url
    });

    for (let i in tagged_user_ids) {
      const id = tagged_user_ids[i];

      notificationPromisesDB.push(
        dbs.createDocument(
          'chat',
          'notifications',
          ID.unique(),
          {
            for_user_id: id,
            posted_at: new Date(posted_at),
            from_username: fromProfile.username,
            message: message,
            from_avatar_url: from_user_avatar_url
          },
          [
            Permission.read(Role.user(id)),
            Permission.delete(Role.user(id))
          ]
        )
      );

      notificationPromises.push(
        dbs.listDocuments('chat', 'profiles', [ q.equal('auth_id', [id]) ]).then(async (data) => {
          const [profile] = data.documents;
          const {push_subscriptions} = profile;

          if (push_subscriptions) {
            push_subscriptions.forEach(async (sub) => {
              await webpush.sendNotification(JSON.parse(sub), notification);
            });
          }

        })
      );
    }

    await Promise.all([

      ...notificationPromises
    ]);
  }

  res.json({
    success: true
  });
};