# Magento Hosting On A2 Hosting

This document seeks to explain how to stand up and configure Magento 2 instances on the hosting provider [A2 Hosting](https://a2hosting.com).  The elastic.io credentials for this service are in BitWarden.

# Gaining SSH Access to Magento instance
From the [**My Products & Services**](https://my.a2hosting.com/clientarea.php?action=products) portal area, one can access the various servers that have been set up by clicking into the rows.

On this page one can learn the SSH port, hostname, username and password.  One can then ssh into the server using a command such as:

`ssh -o PreferredAuthentications=keyboard-interactive,password -o PubkeyAuthentication=no -p 7822 eiotesti@nl1-ss4.a2hosting.com`

with:
* `-o PreferredAuthentications=keyboard-interactive,password -o PubkeyAuthentication=no` required to trigger password authentication
* `-p 7822` to set the correct ssh port
* `eiotwodo@nl1-ss4.a2hosting.com` is the username@SSH hostname

The Magento Installation's files are located at `~/public_html/vendor/magento`

## SCP command to copy files to the server
`scp -o PreferredAuthentications=keyboard-interactive,password -o PubkeyAuthentication=no -P 7822 Magento-CE-2.2.6_sample_data-2018-09-07-02-28-42.zip  eiotesti@nl1-ss4.a2hosting.com:`

# Create New Server Instance
1. From the [**My Products & Services**](https://my.a2hosting.com/clientarea.php?action=products) portal area, click **Actions** -> **Place a New Order**
2. Select **Lite Web Hosting**
3. On the **Choose a Domain..** select `Use a subdomain from A2 Hosting` and enter a domain
4. Decline all of the add-ons on the **Configure** screen.  Make sure to note the Magento Username/Password on this screen if selecting Magento as the serice to install.
5. Click Checkout on the **Review & Checkout** screen.
6. Enter payment method and accept terms and conditions.  The credit card info should be saved (minus CVV).
7. Wait for the VM to be created.  It may take a few (~10) min for the server to become up.

# Downgrade instructions
1. Uninstall existing Magento instance (if one was installed when the machine was set up or installed through softaculous).  
   1. This can be done by loading the **cPanel** for the instance which is selectable from the [**My Products & Services**](https://my.a2hosting.com/clientarea.php?action=products) portal area.
   2. Select **Softaculous Apps Installer**.
   3. Select the installed apps at the top of the Softaculous configuration screen.  Select the X picture to trigger an uninstall.
2. Download the desired Magento version (with or without sample data) from https://magento.com/tech-resources/download
3. Upload the file to the hosting server. (SCP command is above.)
4. Expand the file in the `public_html` directory under the system user's home directory (`~`).
5. In a web browser, navigate to the root URL to trigger the installation UI.
   1. For adding a database, create a MySQL database in cPanel, create a user and enter the details in the **Add a Database** step.
   2. Select Use HTTPS on step 3.
6. Set up [Magento Crontab](https://devdocs.magento.com/guides/v2.2/config-guide/cli/config-cli-subcommands-cron.html#create-or-remove-the-magento-crontab) with `php bin/magento cron:install` (only works for Magento 2.2.x, manual work is required based on the instructions for other installations) and `php bin/magento cron:run`

# Removing Authorization Checks for the API
There is a bug in 2.2.6 that seems to cause API authentication calls to fail on some installations.  The root cause of this issue  has not been determined.  The installs based on the previous steps encounter this problem.  A work around is to comment out the php code which does authentication verification on the REST API.  This would cause all REST calls to pass authentication.  This has been done for the 2.2.6, 2.1.14 and 2.0.18 instance.

More specifically, in the file `/home/eiotesti/public_html/magento_2_2_6/vendor/magento/module-webapi/Controller/Rest/RequestValidator.php`, the code 

```
        if (!$this->authorization->isAllowed($route->getAclResources())) {
            $params = ['resources' => implode(', ', $route->getAclResources())];
            throw new AuthorizationException(
                __('Consumer is not authorized to access %resources', $params)
            );
        }
```
is commented out with `//` comments.  In 2.0.18, this change is made to the `/home/eiotesti/public_html/magento_2_2_6/vendor/magento/module-webapi/Controller/Rest.php` file.

# Noted passwords
* **A2 Hosting (Master)** - Main login to A2 Hostings web interface
* **A2 Hosting eiotesting SSH Credential** - SSH password for main host
* **A2 Hosting EioTesting DB User** - DB user used by all magento instances
* **Magento Admin 2.2.6** - Admin login for the Magento UI.
* **Magento Admin 2.1.14** - Admin login for the Magento UI.
* **Magento Admin 2.0.18** - Admin login for the Magento UI.

All the magento instances are on the same server.  Some browser bugs can be solved by cleaning the site cookies.
