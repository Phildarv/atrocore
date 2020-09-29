<?php

namespace Espo\Core\Utils\Api;

use \Espo\Core\Utils\Api\Slim;

class Auth extends \Slim\Middleware
{
    protected $auth;

    protected $authRequired = null;

    protected $showDialog = false;

    public function __construct(\Espo\Core\Utils\Auth $auth, $authRequired = null, $showDialog = false)
    {
        $this->auth = $auth;
        $this->authRequired = $authRequired;
        $this->showDialog = $showDialog;
    }

    function call()
    {
        $req = $this->app->request();

        $uri = $req->getResourceUri();
        $httpMethod = $req->getMethod();

        $authUsername = $req->headers('PHP_AUTH_USER');
        $authPassword = $req->headers('PHP_AUTH_PW');

        $espoAuth = $req->headers('HTTP_ESPO_AUTHORIZATION');
        if (isset($espoAuth)) {
            list($authUsername, $authPassword) = explode(':', base64_decode($espoAuth), 2);
        }

        if (!isset($authUsername)) {
            if (!empty($_COOKIE['auth-username']) && !empty($_COOKIE['auth-token'])) {
                $authUsername = $_COOKIE['auth-username'];
                $authPassword = $_COOKIE['auth-token'];
            }
        }

        $espoCgiAuth = $req->headers('HTTP_ESPO_CGI_AUTH');
        if (empty($espoCgiAuth)) {
            $espoCgiAuth = $req->headers('REDIRECT_HTTP_ESPO_CGI_AUTH');
        }
        if (!isset($authUsername) && !isset($authPassword) && !empty($espoCgiAuth)) {
            list($authUsername, $authPassword) = explode(':' , base64_decode(substr($espoCgiAuth, 6)));
        }

        if (is_null($this->authRequired)) {
            $routes = $this->app->router()->getMatchedRoutes($httpMethod, $uri);

            if (!empty($routes[0])) {
                $routeConditions = $routes[0]->getConditions();
                if (isset($routeConditions['auth']) && $routeConditions['auth'] === false) {

                    if ($authUsername && $authPassword) {
                        try {
                            $isAuthenticated = $this->auth->login($authUsername, $authPassword);
                        } catch (\Exception $e) {
                            $this->processException($e);
                            return;
                        }
                        if ($isAuthenticated) {
                            $this->next->call();
                            return;
                        }
                    }

                    $this->auth->useNoAuth();
                    $this->next->call();
                    return;
                }
            }
        } else {
            if (!$this->authRequired) {
                $this->auth->useNoAuth();
                $this->next->call();
                return;
            }
        }

        if ($authUsername && $authPassword) {
            try {
                $isAuthenticated = $this->auth->login($authUsername, $authPassword);
            } catch (\Exception $e) {
                $this->processException($e);
                return;
            }

            if ($isAuthenticated) {
                $this->next->call();
            } else {
                $this->processUnauthorized();
            }
        } else {
            if (!$this->isXMLHttpRequest()) {
                $this->showDialog = true;
            }
            $this->processUnauthorized();
        }
    }

    protected function processException(\Exception $e)
    {
        $response = $this->app->response();

        if ($e->getMessage()) {
            $response->headers->set('X-Status-Reason', $e->getMessage());
        }
        $response->setStatus($e->getCode());
    }

    protected function processUnauthorized()
    {
        $response = $this->app->response();

        if ($this->showDialog) {
            $response->headers->set('WWW-Authenticate', 'Basic realm=""');
        }
        $response->setStatus(401);
    }

    protected function isXMLHttpRequest()
    {
        $request = $this->app->request();

        $httpXRequestedWith = $request->headers('HTTP_X_REQUESTED_WITH');

        if (isset($httpXRequestedWith) && strtolower($httpXRequestedWith) == 'xmlhttprequest') {
            return true;
        }

        return false;
    }
}