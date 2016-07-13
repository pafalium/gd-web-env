#lang racket

(require rosetta)

(require json)

(require web-server/servlet
         web-server/servlet-env
         web-server/dispatch)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-syntax-rule
  (for-backends backends expr ...)
  (for ([backend (in-list backends)])
    (parameterize ((current-out-backend backend))
      expr ...)))

#;(for-backends (list autocad sketchup)
                (sphere))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define APPLICATION/JSON-MIME-TYPE #"application/json; charset=utf-8")
(define (response/jsexpr jsexpr
                         #:code [code 200]
                         #:message [message #"Okay"]
                         #:seconds [seconds (current-seconds)]
                         #:mime-type [mime-type APPLICATION/JSON-MIME-TYPE]
                         #:headers [headers '()])
  (response/full code message seconds mime-type
                 headers
                 (list (jsexpr->bytes jsexpr))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-values (dispatch url)
  (dispatch-rules
   [("corners-box") #:method "post" corners-box]
   [("center-sphere") #:method "post" center-sphere]
   [("centers-cylinder") #:method "post" centers-cylinder]
   [("echo-box") #:method "get" echo-box]
   [("erase-all") #:method "get" erase-all]
   [("active-backends") #:method "put" select-backends]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define selected-backends (list autocad))
(define (str->backend str)
  (case str
    [("autocad") autocad]
    [("sketchup") sketchup]
    [("rhino") rhino]
    [("revit") revit]))

(define (select-backends req)
  (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
         [backends-lst (hash-ref req-json 'backends)]
         [new-backends (map str->backend backends-lst)])
    (set! selected-backends new-backends)
    (response/jsexpr
     #hasheq((succeeded . #t)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (corners-box req)
  (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
         [p1-lst (hash-ref req-json 'p1)]
         [p2-lst (hash-ref req-json 'p2)])
    (let ([p1 (xyz (first p1-lst) (second p1-lst) (third p1-lst))]
          [p2 (xyz (first p2-lst) (second p2-lst) (third p2-lst))])
      (for-backends selected-backends
                   (box p1 p2))))
  (response/jsexpr
   #hasheq((id . 10))))

(define (center-sphere req)
  (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
         [c-lst (hash-ref req-json 'center)]
         [radius (hash-ref req-json 'radius)])
    (let ([c (xyz (first c-lst) (second c-lst) (third c-lst))])
      (for-backends selected-backends
                    (sphere c radius))))
  (response/jsexpr
   #hasheq((id . 11))))

(define (centers-cylinder req)
  (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
         [p1-lst (hash-ref req-json 'p1)]
         [p2-lst (hash-ref req-json 'p2)]
         [radius (hash-ref req-json 'radius)])
    (let ([p1 (xyz (first p1-lst) (second p1-lst) (third p1-lst))]
          [p2 (xyz (first p2-lst) (second p2-lst) (third p2-lst))])
      (for-backends selected-backends
                    (cylinder p1 radius p2))))
  (response/jsexpr
   #hasheq((id . 12))))

(define (echo-box request)
  (response/jsexpr
   #hasheq((message . "Boxy box box"))))

(define (erase-all request)
  (for-backends selected-backends
                (delete-all-shapes))
  (response/jsexpr
   #hasheq((succeeded . #t))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(serve/servlet dispatch
               #:extra-files-paths (list (build-path 'same "../dist"))
               #:servlet-path "/"
               #:servlet-regexp #rx"")


