<?php

namespace Espo\Core\Formula\Functions\NumberGroup;

use \Espo\Core\Exceptions\Error;

class FormatType extends \Espo\Core\Formula\Functions\Base
{
    protected function init()
    {
        $this->addDependency('number');
    }

    public function process(\StdClass $item)
    {
        if (!property_exists($item, 'value')) {
            return true;
        }

        if (!is_array($item->value)) {
            throw new Error();
        }

        if (count($item->value) < 1) {
             throw new Error();
        }

        $decimals = null;
        if (count($item->value) > 1) {
            $decimals = $this->evaluate($item->value[1]);
        }

        $decimalMark = null;
        if (count($item->value) > 2) {
            $decimalMark = $this->evaluate($item->value[2]);
        }

        $thousandSeparator = null;
        if (count($item->value) > 3) {
            $thousandSeparator = $this->evaluate($item->value[3]);
        }

        $value = $this->evaluate($item->value[0]);

        return $this->getInjection('number')->format($value, $decimals, $decimalMark, $thousandSeparator);
    }
}