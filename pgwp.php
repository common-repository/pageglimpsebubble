<?php
/*
 * Plugin Name: PageGlimpse Bubble
 * Version: 1.0
 * Plugin URI: http://www.pageglimpse.com/
 * Description: Adds the necessary JavaScript code to enable <a href="http://www.pageglimpse.com/">PageGlimpse bubble</a>. After enabling this plugin visit <a href="options-general.php?page=pgwp.php">the options page</a> and enter your PageGlimpse developer key.
 * Author: RADSense Inc
 * Author URI: http://www.radsense.com/
 */
$pg_data = get_option('pg_data');

// Constants for enabled/disabled state
define("pg_enabled", "enabled", true);
define("pg_disabled", "disabled", true);
define("key_pg_uid", "pg_uid", true);
define("key_pg_status", "pg_status", true);

define("pg_status_default", ga_disabled, true);
define("pg_uid_default", "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", true);

add_option(key_pg_uid, pg_uid_default, 'Your PageGlimpse developer key.');
add_option(key_pg_status, pg_status_default, 'If PageGlimpse is turned on or off.');


if ('insert' == $HTTP_POST_VARS['action'])
{
    update_option("pg_data",$HTTP_POST_VARS['pg_data']);
}


function pg_option_page() {
	$pg_data = get_option('pg_data');
	if (isset($_POST['info_update'])) {
		if ( wp_verify_nonce($_POST['pg-nonce-key'], 'PageGlimpseBubble') ) {
			// Update the status
			$pg_status = $_POST[key_pg_status];
			if (($pg_status != pg_enabled) && ($pg_status != pg_disabled))
				$pg_status = pg_status_default;
			update_option(key_pg_status, $pg_status);
			
			// Update the devkey
			$pg_uid = $_POST[key_pg_uid];
			if ($pg_uid == '')
				$pg_uid = pg_uid_default;
			update_option(key_pg_uid, $pg_uid);
		}
	}
	
	?>
	
		<div class="wrap">
		<form method="post" action="options-general.php?page=pgwp.php">
		<?php pg_nonce_field(); ?>
			<h2>PageGlimpse Bubble Options</h2>
			
			<?php if (get_option(key_pg_status) == pg_disabled) { ?>
				<div style="margin:10px auto; border:3px #f00 solid; background-color:#fdd; color:#000; padding:10px; text-align:center;">
				PageGlimpse Bubble is currently <strong>DISABLED</strong>.
				</div>
			<?php } ?>
			<?php if ((get_option(key_pg_uid) == "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX") && (get_option(key_pg_status) != pg_disabled)) { ?>
				<div style="margin:10px auto; border:3px #f00 solid; background-color:#fdd; color:#000; padding:10px; text-align:center;">
				PageGlimpse Bubble is currently enabled, but you did not enter a PageGlimpse developer key.
				</div>
			<?php } ?>
			<table class="form-table" cellspacing="2" cellpadding="5" width="100%">
				<tr>
					<th width="30%" valign="top" style="padding-top: 10px;">
						<label for="<?php echo key_pg_status ?>">Bubbles are:</label>
					</th>
					<td>
						<?php
						echo "<select name='".key_pg_status."' id='".key_pg_status."'>\n";
						
						echo "<option value='".pg_enabled."'";
						if(get_option(key_pg_status) == pg_enabled)
							echo " selected='selected'";
						echo ">Enabled</option>\n";
						
						echo "<option value='".pg_disabled."'";
						if(get_option(key_pg_status) == pg_disabled)
							echo" selected='selected'";
						echo ">Disabled</option>\n";
						
						echo "</select>\n";
						?>
					</td>
				</tr>
				<tr>
					<th valign="top" style="padding-top: 10px;">
						<label for="<?php echo key_pg_uid; ?>">Your PageGlimpse developer key:</label>
					</th>
					<td>
						<?php
						echo "<input type='text' size='50' ";
						echo "name='".key_pg_uid."' ";
						echo "id='".key_pg_uid."' ";
						echo "value='".get_option(key_pg_uid)."' />\n";
						?>
						<p style="margin: 5px 10px;">Enter your PageGlimpse developer key  in this box. The key is needed for the buble to  show up. Your developer key can be found in your <a href="http://www.pageglimpse.com">PageGlimpse account.</a> </p>
					</td>
				</tr>
			</table>
				<p class="submit">
					<input type='submit' name='info_update' value='Save Changes' />
				</p>
			</div>
		</form>

<?php
} // End pg_option_page()

// wp_nonce
function pg_nonce_field() {
	echo "<input type='hidden' name='pg-nonce-key' value='" . wp_create_nonce('PageGlimpseBubble') . "' />";
}

// Adminmenu Optionen
function pg_add_menu() {
  	add_options_page('PageGlimpse Bubble', 'PageGlimpse Bubble', 8, basename(__FILE__), 'pg_option_page'); 
}


function pg_insert($content = '') {
		global $pg_data;
		
		$pg_pluginpath = get_settings('home')."/wp-content/plugins/pageglimpsebubble/";
		$pg_home = get_bloginfo('home');
		$content = "\n<!-- PageGlimpseBubble Plugin http://www.pageglimpse.com -->\n";
		$content .= "<script type=\"text/javascript\" src=\"". $pg_pluginpath ."pageglimpse.js\"></script>";
		$content .= "<script type=\"text/javascript\">";
		$content .= "glimpseInit(\"". $pg_home ."\",1,0,750, \"". $pg_pluginpath . "\", \"". get_option(key_pg_uid) . "\"); </script>";
			
		$content.= "\n<!-- /PageGlimpseBuble Plugin -->\n";
		print($content);
		
}

// Footer - insert script if enabled
if (get_option(pg_status) == pg_enabled)
{ 
	add_action('wp_footer', 'pg_insert');
}
// add the menu
add_action('admin_menu', 'pg_add_menu');
?>