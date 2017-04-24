(ns sofia2.handler
  (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [ring.middleware.json :refer [wrap-json-params]]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            [clj-http.client :as client]
              [clojure.data.json :as json]))

(def facebook-access-token (System/getenv "FACEBOOK_ACCESS_TOKEN"))

(defn verify-fb
  [{:keys [uri query-string params] :as request}]
  (let [verify-token (get params "hub.verify_token")
        challenge    (get params "hub.challenge")
        mode         (get params "hub.mode")]
    (if (and (= verify-token "sup_sluggie")
             (= mode         "subscribe"))
      challenge
      {:status 403
       :body   "Failed validation. Make sure the validation tokens match."})))

(def message
  [;; attachment
   {:attachment {:type    "image"
                 :payload {:url         ""
                           :is_reusable false}}}
   ;; text
   {:text "Yo"}])

(defn pop-up
  [question [first second] ]
  {:attachment
   {:type    "template"
    :payload {:template_type "generic"
              :elements [{:title question
                          :image_url "http://borgenproject.org/wp-content/uploads/sheldoncooper1.jpg"
                          :buttons [{:type "postback"
                                     :title first
                                     :payload "yes"}
                                    {:type "postback"
                                     :title second
                                     :payload "no"}]}]}}})

(defn send-api
  [sender-id message-map attachment-url]
  (try
    (client/post
     "https://graph.facebook.com/v2.8/me/messages"
     {:query-params {"access_token" facebook-access-token}
      :headers      {"Content-Type" "application/json"}
      :body         (json/write-str {:message  message-map
                                     :recipient {:id sender-id}})})
    (catch Exception e (println (str "caught exception " e)))))

(defn respond-to-post
  [{:keys [params]}]
  (let [messaging-first (-> params :entry (get 0) :messaging (get 0))
        object          (-> params :object)
        sender-id       (-> messaging-first :sender :id)
        message-text    (-> messaging-first :message :text)
        attachments     (-> messaging-first :message :attachments (get 0))
        attachment-type   (-> attachments :type)
        posted-attachment-url (-> attachments :url)
        attachment-url  (-> attachments :payload :url)]

    (if (= object "page")
      (do (future (send-api sender-id {:text message-text} (or attachment-url
                                                               posted-attachment-url)))
          {:status 200 :body "OK"})
      {:status 403 :body "Not a page request"})))

(defn generate-question
  [{{:keys [question answers answer] :as params} :params}]
  (future
    (Thread/sleep 4000)
    (send-api "1687560851259047" (pop-up question answers) nil)))

(defroutes sofia-routes
  (GET  "/" request (verify-fb request))
  (POST "/" request (do (println (:params request)) (respond-to-post request)))
  (GET  "/webhook/question" request {:status 200 :body "Sofia question docs."})
  (POST "/webhook/question" request (generate-question request))
  (GET "/*" request {:status 200 :body request})
  (route/not-found "Not Found"))

(def app
  (-> (wrap-defaults
       sofia-routes
       (assoc-in site-defaults [:security :anti-forgery] false))
      wrap-keyword-params
      wrap-json-params))
