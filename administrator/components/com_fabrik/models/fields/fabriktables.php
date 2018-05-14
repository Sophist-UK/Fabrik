<?php
/**
 * Renders a list of fabrik lists or db tables
 *
 * @package     Joomla
 * @subpackage  Form
 * @copyright   Copyright (C) 2005-2016  Media A-Team, Inc. - All rights reserved.
 * @license     GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

// No direct access
defined('_JEXEC') or die('Restricted access');

use Fabrik\Helpers\Html;
use Fabrik\Helpers\Text;
use Fabrik\Helpers\Worker;

// Required for menus
//require_once JPATH_SITE . '/components/com_fabrik/helpers/html.php';
//require_once JPATH_SITE . '/components/com_fabrik/helpers/string.php';
//require_once JPATH_SITE . '/components/com_fabrik/helpers/parent.php';
require_once JPATH_ADMINISTRATOR . '/components/com_fabrik/helpers/element.php';

jimport('joomla.html.html');
jimport('joomla.form.formfield');
jimport('joomla.form.helper');
JFormHelper::loadFieldClass('list');

/**
 * Renders a list of fabrik lists or db tables
 *
 * @package     Fabrik
 * @subpackage  Form
 * @since       3.0
 */
class JFormFieldFabrikTables extends JFormFieldList
{
	/**
	 * Element name
	 *
	 * @var        string
	 */
	protected $name = 'Fabriktables';

	/**
	 * Fabrik lists
	 *
	 * @var  array
	 */
	protected static $fabrikTables;

	/**
	 * Method to get the field options.
	 *
	 * @return  array  The field option objects.
	 */

	protected function getOptions()
	{
		if (!isset($fabrikTables))
		{
			$fabrikTables = array();
		}

		$connectionDd = $this->element['observe'];
		$db           = Worker::getDbo(true);

		if ($connectionDd == '')
		{
			// We are not monitoring a connection drop down so load in all tables
			$query = $db->getQuery(true);
			$query->select('id AS value, label AS text')->from('#__{package}_lists')->where('published <> -2')->order('label ASC');
			$db->setQuery($query);
			$rows = $db->loadObjectList();
			array_unshift($rows, JHTML::_('select.option', '', FText::_('COM_FABRIK_SELECT_LIST')));

		}
		else
		{
			$rows = array(JHTML::_('select.option', '', Text::_('COM_FABRIK_SELECT_A_CONNECTION_FIRST'), 'value', 'text'));
		}

		return $rows;
	}

	/**
	 * Method to get the field input markup.
	 *
	 * @return  string    The field input markup.
	 */

	protected function getInput()
	{
		$connectionDd       = $this->getAttribute('observe', $this->getAttribute('connection'));
		$connectionInRepeat = Worker::toBoolean($this->getAttribute('connection_in_repeat', 'true'), true);
		$script             = array();

		if (!isset($fabrikTables))
		{
			$fabrikTables = array();
		}

		if ($connectionDd != '' && !array_key_exists($this->id, $fabrikTables))
		{
			$repeatCounter = $this->form->repeat ? (empty($this->form->repeatCounter) ? 0 : $this->form->repeatCounter) : '';
			$connectionDd = Html::getFormRepeatId($connectionDd, $connectionInRepeat, $this->id, $repeatCounter);

			$opts           = new stdClass;
			// Following lines commented out because they are not used in fabriktables.js
			// $opts->livesite = COM_FABRIK_LIVESITE;
			// $opts->container     = 'test';
			// $opts->inRepeatGroup = $this->form->repeat;
			// $opts->repeatCounter = $repeatCounter;
			$opts->conn          = 'jform_' . $connectionDd;
			$opts->connInRepeat  = $connectionInRepeat;
			$opts->value         = $this->value;
			$opts                = json_encode($opts);
			$script              = "FabrikAdmin.model.fields.fabriktable['$this->id'] = new fabriktablesElement('$this->id', $opts);";

			$fabrikTables[$this->id] = true;
			$src['Fabrik']           = 'media/com_fabrik/js/fabrik.js';
			$src['Namespace']        = 'administrator/components/com_fabrik/views/namespace.js';
			$src['FabrikTables']     = 'administrator/components/com_fabrik/models/fields/fabriktables.js';
			Html::script($src, $script);
		}

		$html = parent::getInput();
		$html .= '<img style="margin-left:10px;display:none" id="' . $this->id . '_loader" src="components/com_fabrik/images/ajax-loader.gif" alt="'
			. Text::_('LOADING') . '" />';
		Html::framework();
		Html::iniRequireJS();

		return $html;
	}
}
