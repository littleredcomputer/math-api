(ns net.littleredcomputer.math.api.middleware
  (:require [clojure.tools.logging :as log])
  (:import [com.google.appengine.api.memcache MemcacheServiceFactory AsyncMemcacheService MemcacheService]))

(set! *warn-on-reflection* true)
(defonce ^AsyncMemcacheService async-memcache-service (MemcacheServiceFactory/getAsyncMemcacheService))
(defonce ^MemcacheService memcache-service (MemcacheServiceFactory/getMemcacheService))

(defn log-params
  [handler]
  (fn [request]
    (log/info (:uri request) (:params request))
    (handler request)))

(defmacro cached
  "Synchronously probes GAE Memcache for key-form; returns the corresponding value
  if found; otherwise, evaluates value-form and returns it, while requesting an
  asynchronous association of key -> value to be made in the background."
  [key-form value-form]
  `(let [key# ~key-form
         cached-value# (.get memcache-service key#)]
     (if cached-value#
       (do
         (log/info "cache hit")
         cached-value#)
       (do
         (log/info "cache miss")
         (let [data# ~value-form]
           (.put async-memcache-service key# data#)
           data#)))))

;; sw# (Stopwatch/createStarted)
;; (ThreadManager/createBackgroundThread ^Runnable (fn []
;; (log/info "waiting for cache write")
;; (.get fu#)
;; (log/info "cache write complete in" (str sw#))))